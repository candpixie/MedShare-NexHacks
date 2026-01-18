# /// script
# requires-python = ">=3.11"
# dependencies = [
#   "ucimlrepo",
#   "pandas",
#   "woodwide",
# ]
# ///
import argparse
import os
import sys
import time
import json
import pandas as pd
from woodwide import WoodWide

# Defaults
DEFAULT_BASE_URL = "https://beta.woodwide.ai/"


def setup_args():
    parser = argparse.ArgumentParser(
        description="Test Woodwide API with mock hospital pharmacy inventory dataset"
    )
    parser.add_argument("-k", "--api-key", required=True, help="Woodwide API Key")
    parser.add_argument(
        "-m",
        "--model-name",
        default="pharmacy_usage_model",
        help="Name for the model",
    )
    parser.add_argument(
        "-d",
        "--dataset-name",
        default="mock_medicine_inventory",
        help="Name for the dataset",
    )
    parser.add_argument(
        "--data-path",
        default="./mock_medicine_inventory_timeseries.csv",
        help="Path to dataset CSV",
    )
    parser.add_argument(
        "-o", "--output-file", help="File path to save inference results"
    )
    parser.add_argument(
        "--base-url", default=DEFAULT_BASE_URL, help="Base URL for API"
    )
    parser.add_argument(
        "-c",
        "--clustering",
        action="store_true",
        help="Run clustering instead of prediction",
    )
    return parser.parse_args()


def fetch_and_prepare_data(data_path="./mock_medicine_inventory_timeseries.csv"):
    print(f"Loading dataset from: {data_path}")
    df = pd.read_csv(data_path)

    # Define label / target column
    label_column = "units_used_this_month"

    if label_column not in df.columns:
        raise ValueError(f"Label column '{label_column}' not found in dataset")

    # Simple random 80/20 split
    train_df = df.sample(frac=0.8, random_state=42)
    test_df = df.drop(train_df.index)

    # Save to CSV
    train_path = "pharmacy_train.csv"
    test_path = "pharmacy_test.csv"

    train_df.to_csv(train_path, index=False)
    test_df.to_csv(test_path, index=False)

    print("Data prepared successfully.")
    print(f"Label column: '{label_column}'")
    print(f"Train shape: {train_df.shape}")
    print(f"Test shape: {test_df.shape}")

    return train_path, test_path, label_column



def upload_dataset(client, file_path, name):
    print(f"Uploading {file_path} as '{name}'...")
    start_time = time.time()

    with open(file_path, "rb") as f:
        # Note: The SDK typically handles file opening, but if it takes binary IO:
        dataset = client.api.datasets.upload(
            file=f,
            name=name,
            overwrite=True
        )

    elapsed = time.time() - start_time
    print(f"Upload took {elapsed:.2f}s")

    # Accessing ID directly assuming the SDK returns a Pydantic model
    dataset_id = dataset.id
    print(f"Dataset Uploaded. ID: {dataset_id}\n")
    return dataset_id


def train_model(client, dataset_name, model_name, label_column, is_clustering=False):
    if is_clustering:
        print(f"Training Clustering Model '{model_name}' using dataset '{dataset_name}'...")
        endpoint = "/api/models/clustering/train"
        data = {
            "model_name": model_name,
            "overwrite": "true",
        }
    else:
        print(f"Training Prediction Model '{model_name}' using dataset '{dataset_name}'...")
        endpoint = "/api/models/prediction/train"
        data = {
            "model_name": model_name,
            "label_column": label_column,
            "overwrite": "true",
        }

    start_time = time.time()

    # Make the raw HTTP request for this endpoint, it's having issues
    response = client._client.post(
        endpoint,
        params={"dataset_name": dataset_name},
        data=data,
        headers=client.auth_headers,
    )

    elapsed = time.time() - start_time
    print(f"Request took {elapsed:.2f}s")

    if response.status_code != 200:
        print(f"Error starting training: {response.status_code}")
        print(response.text)
        sys.exit(1)

    response_json = response.json()
    model_id = response_json.get("id")
    if not model_id:
        print("Error: No Model ID returned")
        print(response_json)
        sys.exit(1)

    print(f"Model Training Started. ID: {model_id}\n")
    return model_id


def wait_for_training(client, model_id):
    print(f"Waiting for Model Training to Complete (ID: {model_id})...")
    start_time = time.time()
    timeout = 3000

    while True:
        model = client.api.models.retrieve(model_id)
        training_status = model.training_status

        if training_status == "COMPLETE":
            print("Training Complete.")
            print(model)
            break
        elif training_status == "FAILED":
            print("Error: Model Training Failed.")
            print(model)
            sys.exit(1)

        elapsed = time.time() - start_time
        if elapsed >= timeout:
            print(f"Error: Training Timed Out after {timeout} seconds.")
            sys.exit(1)

        print(f"Status: {training_status}. Waiting...")
        time.sleep(2)

    print(f"Success: Took {elapsed:.2f} seconds to train model.\n")


def run_inference(client, model_id, test_dataset_id, output_file, is_clustering=False):
    print(
        f"Running Inference on Model {model_id} with Test Dataset ID {test_dataset_id}..."
    )
    start_time = time.time()

    if is_clustering:
        result = client.api.models.clustering.infer(
            model_id=model_id,
            dataset_id=test_dataset_id
        )
    else:
        result = client.api.models.prediction.infer(
            model_id=model_id,
            dataset_id=test_dataset_id
        )

    elapsed = time.time() - start_time
    print(f"Inference took {elapsed:.2f}s")

    # Convert result to DataFrame
    if hasattr(result, "model_dump"):
        result_dict = result.model_dump()
    elif isinstance(result, dict):
        result_dict = result
    else:
        result_dict = json.loads(result) if isinstance(result, str) else {}

    # Convert to DataFrame and save as CSV
    result_df = pd.DataFrame(result_dict if isinstance(result_dict, list) else [result_dict])
    
    # Set default output file if not provided
    if not output_file:
        output_file = "cluster_output.csv" if is_clustering else "inference_output.csv"
    
    # Ensure the output file is saved in wood_wide_models directory
    output_path = os.path.join(os.path.dirname(__file__), output_file)
    result_df.to_csv(output_path, index=False)
    print(f"Results saved to: {output_path}")
    print("")


def main():
    args = setup_args()

    # Initialize SDK Client
    client = WoodWide(
        api_key=args.api_key,
        base_url=args.base_url
    )
    # 1. Fetch Data
    train_path, test_path, label_column = fetch_and_prepare_data()

    try:
        # 2. Upload Train
        train_dataset_id = upload_dataset(
            client, train_path, args.dataset_name
        )

        # 3. Upload Test
        test_dataset_name = f"{args.dataset_name}_test"
        test_dataset_id = upload_dataset(
            client, test_path, test_dataset_name
        )

        # 4. Train Model
        model_id = train_model(
            client,
            args.dataset_name,
            args.model_name,
            label_column,
            is_clustering=args.clustering,
        )

        # 5. Wait for Training
        wait_for_training(client, model_id)

        # 6. Run Inference
        run_inference(
            client, model_id, test_dataset_id, args.output_file, is_clustering=args.clustering
        )

    finally:
        # Cleanup temp files
        if os.path.exists(train_path):
            os.remove(train_path)
        if os.path.exists(test_path):
            os.remove(test_path)


if __name__ == "__main__":
    main()