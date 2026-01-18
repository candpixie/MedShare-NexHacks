# /// script
# requires-python = ">=3.11"
# dependencies = [
#   "ucimlrepo",
#   "pandas",
#   "woodwide",
# ]
# ///

from __future__ import annotations

import json
import os
import sys
import time
from dataclasses import dataclass
from pathlib import Path
from typing import Any, Literal, Optional

import pandas as pd
from woodwide import WoodWide

# Load environment variables from .env file if it exists
try:
    from dotenv import load_dotenv
    env_file = Path(__file__).parent.parent / ".env"
    if env_file.exists():
        load_dotenv(env_file)
except ImportError:
    pass

DEFAULT_BASE_URL = "https://beta.woodwide.ai/"
DEFAULT_LABEL_COLUMN = "units_used_this_month"

#sUseCase = Literal["prediction", "clustering"]


@dataclass(frozen=True)
class WoodwideRunResult:
    usecase: str
    model_id: str
    train_dataset_id: str
    test_dataset_id: str
    label_column: Optional[str]
    inference_result: Any


# -------------------------
# Data preparation
# -------------------------

def fetch_and_prepare_data(
    *,
    data_path: str,
    label_column: str = DEFAULT_LABEL_COLUMN,
    train_out: str = "pharmacy_train.csv",
    test_out: str = "pharmacy_test.csv",
    train_frac: float = 0.8,
    random_state: int = 42,
) -> tuple[str, str, Optional[str]]:
    print(f"Loading dataset from: {data_path}")
    df = pd.read_csv(data_path)

    if label_column not in df.columns:
        raise ValueError(f"Label column '{label_column}' not found in dataset")

    train_df = df.sample(frac=train_frac, random_state=random_state)
    test_df = df.drop(train_df.index)

    train_df.to_csv(train_out, index=False)
    test_df.to_csv(test_out, index=False)

    print("Data prepared successfully.")
    print(f"Label column: '{label_column}'")
    print(f"Train shape: {train_df.shape}")
    print(f"Test shape:  {test_df.shape}")

    return train_out, test_out, label_column


# -------------------------
# WoodWide operations
# -------------------------

def upload_dataset(client: WoodWide, file_path: str, name: str) -> str:
    print(f"Uploading {file_path} as '{name}'...")
    start = time.time()

    with open(file_path, "rb") as f:
        dataset = client.api.datasets.upload(
            file=f,
            name=name,
            overwrite=True,
        )

    elapsed = time.time() - start
    print(f"Upload took {elapsed:.2f}s")
    print(f"Dataset Uploaded. ID: {dataset.id}\n")
    return dataset.id


def train_model(
    *,
    client: WoodWide,
    dataset_name: str,
    model_name: str,
    usecase: str,
    label_column: Optional[str],
) -> str:
    if usecase == "embedding":
        endpoint = "/api/models/embedding/train"
        data = {"model_name": model_name, "overwrite": "true"}
        print(f"Training Embedding Model '{model_name}'...")
    elif usecase == "anomaly":
        endpoint = "/api/models/anomaly/train"
        data = {"model_name": model_name, "overwrite": "true"}
        print(f"Training Anomaly Detection Model '{model_name}'...")
    else:
        if not label_column:
            raise ValueError("label_column is required for prediction usecase")
        endpoint = "/api/models/prediction/train"
        data = {
            "model_name": model_name,
            "label_column": label_column,
            "overwrite": "true",
        }
        print(f"Training Prediction Model '{model_name}'...")

    start = time.time()
    response = client._client.post(
        endpoint,
        params={"dataset_name": dataset_name},
        data=data,
        headers=client.auth_headers,
    )

    elapsed = time.time() - start
    print(f"Training request took {elapsed:.2f}s")

    if response.status_code != 200:
        raise RuntimeError(
            f"Training failed ({response.status_code}): {response.text}"
        )

    model_id = response.json().get("id")
    if not model_id:
        raise RuntimeError("No model ID returned from training endpoint")

    print(f"Model Training Started. ID: {model_id}\n")
    return model_id


def wait_for_training(
    client: WoodWide,
    model_id: str,
    *,
    timeout_s: int = 3000,
    poll_s: int = 2,
) -> None:
    print(f"Waiting for model {model_id} to complete training...")
    start = time.time()

    while True:
        model = client.api.models.retrieve(model_id)
        status = getattr(model, "training_status", None)

        if status == "COMPLETE":
            print(f"Training complete in {time.time() - start:.2f}s\n")
            return

        if status == "FAILED":
            print(model)
            raise RuntimeError("Model training failed")

        if time.time() - start > timeout_s:
            raise TimeoutError("Model training timed out")

        print(f"Status: {status}. Waiting...")
        time.sleep(poll_s)


def run_inference(
    *,
    client: WoodWide,
    model_id: str,
    test_dataset_id: str,
    usecase: str,
) -> Any:
    print(f"Running inference on model {model_id}...")

    start = time.time()
    if usecase == "embedding":
        result = client.api.models.embedding.infer(
            model_id=model_id,
            dataset_id=test_dataset_id,
        )
    elif usecase == "anomaly":
        result = client.api.models.anomaly.infer(
            model_id=model_id,
            dataset_id=test_dataset_id,
        )
    else:
        result = client.api.models.prediction.infer(
            model_id=model_id,
            dataset_id=test_dataset_id,
        )

    print(f"Inference completed in {time.time() - start:.2f}s")
    return result


def format_result(result: Any) -> str:
    if hasattr(result, "model_dump_json"):
        return result.model_dump_json(indent=2)
    if isinstance(result, (dict, list)):
        return json.dumps(result, indent=2)
    return str(result)


# -------------------------
# Public entrypoint
# -------------------------

def woodwide_run(
    *,
    usecase: str,
    api_key: str,
    model_name: str,
    dataset_name: str,
    data_path: str,
    base_url: str = DEFAULT_BASE_URL,
    output_file: Optional[str] = None,
    label_column: str = DEFAULT_LABEL_COLUMN,
    cleanup_temp_files: bool = True,
) -> WoodwideRunResult:
    """
    End-to-end WoodWide workflow.
    This function is the ONLY intended entrypoint.
    """
    client = WoodWide(api_key=api_key, base_url=base_url)

    train_path = test_path = ""
    train_dataset_id = test_dataset_id = model_id = ""

    effective_label = None if usecase in ("embedding", "anomaly") else label_column

    try:
        train_path, test_path, prepared_label = fetch_and_prepare_data(
            data_path=data_path,
            label_column=label_column,
        )
        if usecase == "anomaly":
            effective_label = prepared_label

        train_dataset_id = upload_dataset(client, train_path, dataset_name)
        test_dataset_id = upload_dataset(
            client, test_path, f"{dataset_name}_test"
        )

        model_id = train_model(
            client=client,
            dataset_name=dataset_name,
            model_name=model_name,
            usecase=usecase,
            label_column=effective_label,
        )

        wait_for_training(client, model_id)

        inference_result = run_inference(
            client=client,
            model_id=model_id,
            test_dataset_id=test_dataset_id,
            usecase=usecase,
        )

        if output_file:
            with open(output_file, "w", encoding="utf-8") as f:
                f.write(format_result(inference_result))

        return WoodwideRunResult(
            usecase=usecase,
            model_id=model_id,
            train_dataset_id=train_dataset_id,
            test_dataset_id=test_dataset_id,
            label_column=effective_label,
            inference_result=inference_result,
        )

    finally:
        if cleanup_temp_files:
            for p in (train_path, test_path):
                if p and os.path.exists(p):
                    try:
                        os.remove(p)
                    except OSError:
                        pass

# Example usage for anomaly detection:
# result = woodwide_run(
#     usecase="anomaly",
#     api_key="your-api-key",
#     model_name="medicine_inventory_anomaly",
#     dataset_name="medicine_inventory_anomaly_dataset",
#     data_path="./mock_medicine_inventory_timeseries.csv",
#     output_file="anomaly_detection_output.csv"
# )

if __name__ == "__main__":
    api_key = os.getenv("WOODWIDE_API_KEY")
    if not api_key:
        api_key = input("Enter your Woodwide API Key: ").strip()
        if not api_key:
            print("Error: API key is required.")
            sys.exit(1)
    
    try:
        result = woodwide_run(
            usecase="anomaly",
            api_key=api_key,
            model_name="mock_medicine_inventory_anomaly",
            dataset_name="mock_medicine_inventory_anomaly_dataset",
            data_path="./mock_medicine_inventory_timeseries.csv",
            output_file="anomaly_detection_output.csv"
        )
        print("\n✓ Anomaly detection workflow completed successfully!")
        print(f"Model ID: {result.model_id}")
        print(f"Train Dataset ID: {result.train_dataset_id}")
        print(f"Test Dataset ID: {result.test_dataset_id}")
    except Exception as e:
        print(f"Error: {type(e).__name__}: {e}")
        sys.exit(1)