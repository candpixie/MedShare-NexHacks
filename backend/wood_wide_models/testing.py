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


def fetch_and_prepare_data(data_path="./daily_inventory.csv", label_column="monthly_usage_total_units"):
    print(f"Loading dataset from: {data_path}")
    
    # Read CSV with robust parsing to handle malformed rows
    df = pd.read_csv(
        data_path,
        on_bad_lines="skip",  # Skip rows with too many/too few fields
        engine="python",  # Use Python engine for better handling of complex CSVs
    )
    
    # Strip whitespace from column names
    df.columns = df.columns.str.strip()
    
    # Strip whitespace from all string columns
    for col in df.select_dtypes(include=['object']).columns:
        df[col] = df[col].str.strip()

    if label_column not in df.columns:
        raise ValueError(f"Label column '{label_column}' not found in dataset. Available columns: {df.columns.tolist()}")

    print(f"Dataset loaded. Initial shape: {df.shape}")
    print(f"Missing values per column:\n{df.isnull().sum()}")
    
    # Convert label column to numeric, coercing errors to NaN
    df[label_column] = pd.to_numeric(df[label_column], errors='coerce')
    
    # Remove rows with missing label values (critical)
    initial_count = len(df)
    df = df.dropna(subset=[label_column])
    removed_count = initial_count - len(df)
    if removed_count > 0:
        print(f"Removed {removed_count} rows with missing/invalid label values")
    
    # For other columns, fill NaN values intelligently
    # For numeric columns: fill with median
    numeric_cols = df.select_dtypes(include=['number']).columns
    for col in numeric_cols:
        if col != label_column and df[col].isnull().sum() > 0:
            median_val = df[col].median()
            df[col] = df[col].fillna(median_val)
    
    # For string columns: fill with 'Unknown'
    string_cols = df.select_dtypes(include=['object']).columns
    for col in string_cols:
        if df[col].isnull().sum() > 0:
            df[col] = df[col].fillna('Unknown')
    
    if len(df) == 0:
        raise ValueError(
            f"No valid data rows remaining after cleaning. "
            f"Check that '{label_column}' has valid numeric values."
        )
    
    print(f"Dataset shape after cleaning: {df.shape}")

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

    # Assuming result is a dict or list, or a Pydantic model we can dump
    try:
        # If it's a Pydantic model
        if hasattr(result, "model_dump_json"):
             formatted_result = result.model_dump_json(indent=2)
        # If it's a dict
        elif isinstance(result, (dict, list)):
            formatted_result = json.dumps(result, indent=2)
        else:
            formatted_result = str(result)
    except Exception:
        formatted_result = str(result)

    if output_file:
        with open(output_file, "w") as f:
            f.write(formatted_result)
        print(f"Inference results saved to {output_file}")
    else:
        print("Inference Response:")
        print(formatted_result)
    print("")


def main():
    args = setup_args()

    # Initialize SDK Client
    client = WoodWide(
        api_key=args.api_key,
        base_url=args.base_url
    )
    # 1. Fetch Data
    train_path, test_path, label_column = fetch_and_prepare_data(args.data_path)

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