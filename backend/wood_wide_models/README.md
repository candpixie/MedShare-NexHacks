# 🤖 Wood Wide AI Integration - MedShare Pharmacy Intelligence

## 📌 Executive Summary

MedShare uses Wood Wide AI's API as the backbone of a compound decision system, not just a single model call. We run pharmacy inventory through multiple models—risk clustering, demand forecasting, and anomaly detection—and connect their outputs to drive real operational decisions instead of standalone analytics.

Where we go deeper than most teams is in how models are evaluated and deployed. Rather than relying on default settings, we calculate our own domain-specific metrics from live inventory data, like forecast error and expiration risk accuracy. We use those metrics to automatically promote or roll back models in production, so the system improves over time without manual retraining. This added layer of evaluation and control makes MedShare closer to a real production system than a typical hackathon prototype.

The product is built for hospital pharmacy teams managing thousands of medications under time pressure. MedShare creates a clear decision moment by reducing complexity to three actions: transfer excess inventory, reduce orders, or fix stock rotation. In the demo, the system flags $4,200 in expiring medication and recommends transferring 25 units based on predicted demand, showing both technical depth and real-world impact.

---

## 🎯 Overview

This directory contains **MedShare's integration with Wood Wide AI** - an enterprise-grade AutoML platform that powers our **predictive analytics, clustering, and anomaly detection** for hospital pharmacy inventory management.

Wood Wide AI provides **state-of-the-art machine learning models** without requiring deep ML expertise, enabling MedShare to deliver intelligent inventory forecasting and optimization.

---

## 📋 Table of Contents

- [Executive Summary](#-executive-summary)
- [What is Wood Wide AI?](#-what-is-wood-wide-ai)
- [Our Approach](#-our-approach)
- [Architecture](#-architecture)
- [Use Cases](#-use-cases)
- [Implementation](#-implementation)
- [API Integration](#-api-integration)
- [Model Management](#-model-management)
- [Files Overview](#-files-overview)
- [Usage Examples](#-usage-examples)
- [Troubleshooting](#-troubleshooting)
- [Best Practices](#-best-practices)
- [Quick Reference](#-quick-reference-card)

---

## 🌲 What is Wood Wide AI?

**Wood Wide AI** is an enterprise AutoML platform that provides:
- **Automated Machine Learning** - No ML expertise required
- **Model Training & Deployment** - Upload data → Train → Infer
- **Multiple Use Cases** - Prediction, Clustering, Anomaly Detection
- **Production-Ready** - Scalable, monitored, and version-controlled
- **SDK Integration** - Python SDK for seamless integration

**Website**: https://beta.woodwide.ai/

---

## 🎨 Our Approach

### Core Philosophy

MedShare uses Wood Wide AI to transform **raw pharmacy inventory data** into **actionable intelligence**:

```
Raw Inventory Data → Wood Wide AI → Intelligent Predictions
                     ↓
            [AutoML Training]
                     ↓
        ┌────────────┴────────────┐
        ↓                         ↓
   Predictions              Clustering
        ↓                         ↓
  Demand Forecast         Drug Grouping
  Stock Optimization      Usage Patterns
  Reorder Alerts          Anomaly Detection
```

### Why Wood Wide?

1. **No ML Team Required** - Wood Wide handles model selection, hyperparameter tuning, and optimization
2. **Fast Iteration** - Train, evaluate, and deploy models in minutes
3. **Production Quality** - Enterprise-grade reliability and performance
4. **Continuous Improvement** - Easy model versioning and A/B testing
5. **Cost Effective** - Pay only for training and inference, no infrastructure management

### Our Integration Strategy

We've built a **streamlined Python-based integration** that leverages Wood Wide's REST API through their official Python SDK (`woodwide-python`). Our approach focuses on:

1. **Single Entrypoint Design** - All workflows go through one function: `woodwide_run()`
2. **Automatic Data Preparation** - We handle train/test splits, CSV formatting, and validation
3. **Error Handling & Retries** - Robust polling for async training jobs with configurable timeouts
4. **Model Lifecycle Management** - Versioning, promotion, and A/B testing built-in
5. **Direct REST API Access** - When the SDK doesn't expose an endpoint, we use `client._client.post()` directly

---

## 🏗 Architecture

### System Design

```
┌─────────────────────────────────────────────────────────────────┐
│                    MedShare Backend (Python)                     │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │              wood_wide_models/                            │  │
│  │                                                            │  │
│  │  ┌────────────────┐        ┌────────────────────────┐   │  │
│  │  │ Data Pipeline  │        │ Model Management       │   │  │
│  │  │ • Supabase     │   →    │ • Training Pipeline    │   │  │
│  │  │ • CSV Export   │        │ • Version Control      │   │  │
│  │  │ • Train/Test   │        │ • A/B Testing          │   │  │
│  │  │ • Validation   │        │ • Metric Tracking      │   │  │
│  │  └────────────────┘        └────────────────────────┘   │  │
│  │           ↓                            ↓                  │  │
│  │  ┌─────────────────────────────────────────────────┐    │  │
│  │  │    Wood Wide Python Integration Layer            │    │  │
│  │  │                                                   │    │  │
│  │  │  • SDK: from woodwide import WoodWide            │    │  │
│  │  │  • Hybrid: SDK methods + direct REST calls       │    │  │
│  │  │  • Auth: Bearer token (API key)                  │    │  │
│  │  │  • Base URL: https://beta.woodwide.ai/           │    │  │
│  │  │                                                   │    │  │
│  │  │  SDK Methods:                                     │    │  │
│  │  │    ✅ client.api.datasets.upload()               │    │  │
│  │  │    ✅ client.api.models.retrieve()               │    │  │
│  │  │    ✅ client.api.models.prediction.infer()       │    │  │
│  │  │    ✅ client.api.models.clustering.infer()       │    │  │
│  │  │                                                   │    │  │
│  │  │  Direct REST:                                     │    │  │
│  │  │    ⚠️ client._client.post("/api/.../train", ...) │    │  │
│  │  └─────────────────────────────────────────────────┘    │  │
│  └──────────────────────────────────────────────────────────┘  │
└───────────────────────┬─────────────────────────────────────────┘
                        │
                        ↓ HTTPS (REST API + JSON)
┌─────────────────────────────────────────────────────────────────┐
│                  Wood Wide AI Platform (External)                │
│                  https://beta.woodwide.ai/                       │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  AutoML Engine                                            │  │
│  │  • Automated Feature Engineering                          │  │
│  │  • Automatic Model Selection (XGBoost, LightGBM, etc.)   │  │
│  │  • Hyperparameter Optimization                            │  │
│  │  • GPU-Accelerated Training                               │  │
│  │  • Model Registry & Versioning                            │  │
│  │  • Production Inference Endpoints                         │  │
│  └──────────────────────────────────────────────────────────┘  │
└───────────────────────┬─────────────────────────────────────────┘
                        │
                        ↓ Trained Models & Predictions
┌─────────────────────────────────────────────────────────────────┐
│                    MedShare Application                          │
│  • Dashboard Analytics                                           │
│  • Inventory Forecasting                                         │
│  • Smart Reordering Alerts                                       │
│  • Anomaly Detection Alerts                                      │
│  • Cluster-Based Optimization                                    │
└─────────────────────────────────────────────────────────────────┘
```

### Our Workflow Architecture

We've designed a **clean, repeatable pipeline** that every use case follows:

```
Step 1: Data Preparation         Step 2: Upload to Wood Wide
┌─────────────────────┐          ┌──────────────────────┐
│ • Fetch from        │          │ • SDK: datasets.     │
│   Supabase          │   ───>   │   upload()           │
│ • Clean & validate  │          │ • Get dataset IDs    │
│ • Train/test split  │          │ • Overwrite existing │
│ • Save CSVs         │          │                      │
└─────────────────────┘          └──────────────────────┘
         │                                  │
         └──────────────┬───────────────────┘
                        ↓
Step 3: Train Model               Step 4: Poll Training Status
┌─────────────────────┐          ┌──────────────────────┐
│ • REST: POST /api/  │          │ • SDK: models.       │
│   models/.../train  │   ───>   │   retrieve(id)       │
│ • Specify label     │          │ • Check status every │
│   column            │          │   2 seconds          │
│ • Get model ID      │          │ • Wait for COMPLETE  │
└─────────────────────┘          └──────────────────────┘
         │                                  │
         └──────────────┬───────────────────┘
                        ↓
Step 5: Run Inference             Step 6: Process Results
┌─────────────────────┐          ┌──────────────────────┐
│ • SDK: prediction.  │          │ • Save to CSV        │
│   infer() or        │   ───>   │ • Update Supabase    │
│   clustering.infer()│          │ • Calculate metrics  │
│ • Get predictions   │          │ • Promote if better  │
└─────────────────────┘          └──────────────────────┘
```

### Single Entrypoint Philosophy

**All workflows** use the same function: `woodwide_run()`

```python
def woodwide_run(
    *,
    usecase: str,              # "prediction" or "clustering"
    api_key: str,              # Wood Wide API key
    model_name: str,           # Name for your model
    dataset_name: str,         # Name for your dataset
    data_path: str,            # Path to CSV file
    label_column: str,         # Target variable (prediction only)
    base_url: str = "https://beta.woodwide.ai/",
    output_file: Optional[str] = None,  # Where to save results
    cleanup_temp_files: bool = True,    # Delete temp CSVs
) -> WoodwideRunResult:
    """
    End-to-end Wood Wide workflow.
    
    This function orchestrates:
    1. Data preparation (train/test split)
    2. Dataset upload (SDK)
    3. Model training (REST)
    4. Training status polling (SDK)
    5. Inference (SDK)
    6. Result formatting & cleanup
    
    Returns structured result with model ID, predictions, etc.
    """
```

**Why Single Entrypoint?**
- ✅ **Consistency** - Every use case follows same pattern
- ✅ **Maintainability** - Changes in one place affect all uses
- ✅ **Error Handling** - Centralized try/catch and cleanup
- ✅ **Testing** - Easy to mock and unit test

---

## 🎯 Use Cases

### 1. **Demand Prediction** 📈

**Goal**: Forecast future medication demand to optimize ordering

**Implementation**: `prediction-model.py`, `model_train_and_inference`

**How It Works**:
```python
# 1. Prepare historical inventory data
data = fetch_inventory_timeseries()  # medicine, date, quantity, usage

# 2. Upload to Wood Wide
client = WoodWide(api_key=API_KEY)
dataset = client.api.datasets.upload(file=data, name="inventory_timeseries")

# 3. Train prediction model
response = client._client.post(
    "/api/models/prediction/train",
    params={"dataset_name": "inventory_timeseries"},
    data={
        "model_name": "demand_forecast_v1",
        "label_column": "future_demand",
        "overwrite": "true"
    }
)

# 4. Wait for training to complete
model_id = response.json()["id"]
wait_for_training(client, model_id)

# 5. Run inference on new data
predictions = client.api.models.prediction.infer(
    model_id=model_id,
    dataset_id=new_data_id
)
```

**Output**: Predicted demand for each medication for next 7-30 days

### 2. **Drug Clustering** 🔍

**Goal**: Group similar medications for intelligent inventory management

**Implementation**: `clustering-model.py`, `cluster-model.py`

**How It Works**:
```python
# 1. Prepare drug features
features = extract_drug_features()  # usage_patterns, cost, form, etc.

# 2. Upload to Wood Wide
dataset = client.api.datasets.upload(file=features, name="drug_features")

# 3. Train clustering model
response = client._client.post(
    "/api/models/clustering/train",
    params={"dataset_name": "drug_features"},
    data={
        "model_name": "drug_clusters_v1",
        "overwrite": "true"
    }
)

# 4. Get cluster assignments
clusters = client.api.models.clustering.infer(
    model_id=model_id,
    dataset_id=dataset_id
)
```

**Output**: Cluster assignments for inventory optimization strategies

### 3. **Anomaly Detection** 🚨

**Goal**: Identify unusual patterns in inventory usage

**Implementation**: `anomaly-model.py`

**How It Works**:
```python
# 1. Train on normal usage patterns
normal_data = get_historical_usage()
model = train_anomaly_model(normal_data)

# 2. Detect anomalies in new data
new_usage = get_current_usage()
anomalies = detect_anomalies(model, new_usage)

# 3. Alert pharmacy staff
for anomaly in anomalies:
    send_alert(anomaly.medicine, anomaly.severity)
```

**Output**: Real-time alerts for unusual usage, potential stockouts, or theft

---

## 🔧 Implementation

### Core Workflow

All our Wood Wide integrations follow this **5-step pattern**:

#### 1. **Data Preparation**
```python
# Export from Supabase
data = supabase.table('daily_inventory').select('*').execute()

# Transform to CSV
df = pd.DataFrame(data.data)
df.to_csv('training_data.csv', index=False)
```

#### 2. **Upload Dataset**
```python
def upload_dataset(client: WoodWide, file_path: str, name: str) -> str:
    """Upload CSV to Wood Wide platform"""
    with open(file_path, "rb") as f:
        dataset = client.api.datasets.upload(
            file=f,
            name=name,
            overwrite=True,
        )
    return dataset.id
```

#### 3. **Train Model**
```python
def train_model(client: WoodWide, dataset_name: str, model_name: str, 
                label_column: str = None, usecase: str = "prediction") -> str:
    """Trigger model training on Wood Wide"""
    
    if usecase == "clustering":
        endpoint = "/api/models/clustering/train"
        data = {"model_name": model_name, "overwrite": "true"}
    else:
        endpoint = "/api/models/prediction/train"
        data = {
            "model_name": model_name,
            "label_column": label_column,
            "overwrite": "true"
        }
    
    response = client._client.post(
        endpoint,
        params={"dataset_name": dataset_name},
        data=data,
        headers=client.auth_headers,
    )
    
    return response.json()["id"]
```

#### 4. **Wait for Training**
```python
def wait_for_training(client: WoodWide, model_id: str, timeout_s: int = 3000) -> None:
    """Poll model status until training completes"""
    start = time.time()
    
    while True:
        model = client.api.models.retrieve(model_id)
        status = model.training_status
        
        if status == "COMPLETE":
            print(f"✅ Training complete!")
            return
        elif status == "FAILED":
            raise RuntimeError(f"Training failed: {model.error}")
        
        if time.time() - start > timeout_s:
            raise TimeoutError("Training timeout")
        
        time.sleep(2)
```

#### 5. **Run Inference**
```python
def run_inference(client: WoodWide, model_id: str, test_dataset_id: str, 
                  output_file: str, usecase: str = "prediction") -> pd.DataFrame:
    """Generate predictions on new data"""
    
    if usecase == "clustering":
        result = client.api.models.clustering.infer(
            model_id=model_id,
            dataset_id=test_dataset_id,
        )
    else:
        result = client.api.models.prediction.infer(
            model_id=model_id,
            dataset_id=test_dataset_id,
        )
    
    # Save results
    df = pd.read_csv(io.BytesIO(result))
    df.to_csv(output_file, index=False)
    return df
```

---

## 🔌 API Integration

### Our Hybrid Approach: SDK + Direct REST API

We use a **hybrid integration strategy** that combines Wood Wide's official Python SDK with direct REST API calls:

```python
from woodwide import WoodWide
import os

# Initialize client
client = WoodWide(
    api_key=os.getenv("WOODWIDE_API_KEY"),
    base_url="https://beta.woodwide.ai/"
)
```

**Why Hybrid?**
- ✅ **SDK Methods** - For dataset upload and inference (well-supported)
- ✅ **Direct REST** - For training endpoints (not fully exposed by SDK)
- ✅ **Best of Both** - Type safety + flexibility

### Authentication Flow

Wood Wide uses **API key authentication** via Bearer token:

```python
# Authentication happens automatically through the SDK
client = WoodWide(api_key=os.getenv("WOODWIDE_API_KEY"))

# For direct REST calls, access auth headers:
headers = client.auth_headers  # {"Authorization": "Bearer <api_key>"}

# Make authenticated request
response = client._client.post(
    "/api/models/prediction/train",
    params={"dataset_name": "my_dataset"},
    data={"model_name": "my_model", "overwrite": "true"},
    headers=headers
)
```

### Key Endpoints We Use

| Endpoint | Method | How We Use It | Access Method |
|----------|--------|---------------|---------------|
| `/api/datasets/upload` | POST | Upload training/test data | **SDK**: `client.api.datasets.upload()` |
| `/api/models/prediction/train` | POST | Train prediction model | **REST**: `client._client.post()` |
| `/api/models/clustering/train` | POST | Train clustering model | **REST**: `client._client.post()` |
| `/api/models/{id}` | GET | Poll training status | **SDK**: `client.api.models.retrieve()` |
| `/api/models/prediction/infer` | POST | Generate predictions | **SDK**: `client.api.models.prediction.infer()` |
| `/api/models/clustering/infer` | POST | Run clustering | **SDK**: `client.api.models.clustering.infer()` |

### Complete End-to-End API Flow

Here's the **exact sequence** our code follows:

```python
# 1. INITIALIZE CLIENT
client = WoodWide(
    api_key=os.getenv("WOODWIDE_API_KEY"),
    base_url="https://beta.woodwide.ai/"
)

# 2. PREPARE & UPLOAD DATA (SDK)
train_dataset = client.api.datasets.upload(
    file=open("pharmacy_train.csv", "rb"),
    name="pharmacy_inventory_v3",
    overwrite=True
)
# → Returns: {"id": "dataset_train123", ...}

test_dataset = client.api.datasets.upload(
    file=open("pharmacy_test.csv", "rb"),
    name="pharmacy_inventory_v3_test",
    overwrite=True
)
# → Returns: {"id": "dataset_test456", ...}

# 3. TRAIN MODEL (REST)
response = client._client.post(
    "/api/models/prediction/train",
    params={"dataset_name": "pharmacy_inventory_v3"},
    data={
        "model_name": "demand_forecast_v4",
        "label_column": "units_used_next_week",
        "overwrite": "true"
    },
    headers=client.auth_headers
)
model_id = response.json()["id"]
# → Returns: {"id": "model_789xyz", "status": "training", ...}

# 4. WAIT FOR TRAINING (SDK)
while True:
    model = client.api.models.retrieve(model_id)
    if model.training_status == "COMPLETE":
        break
    time.sleep(2)
# → Training typically takes 2-10 minutes

# 5. RUN INFERENCE (SDK)
predictions = client.api.models.prediction.infer(
    model_id=model_id,
    dataset_id=test_dataset.id
)
# → Returns predictions with confidence scores

# 6. SAVE RESULTS
df = pd.DataFrame(predictions.predictions)
df.to_csv("inference_output.csv", index=False)
```

### Why We Mix SDK and REST

**SDK Works Great For:**
- ✅ Dataset upload (multipart file handling)
- ✅ Model retrieval/status (well-typed responses)
- ✅ Inference (clean API, good error handling)

**Direct REST Needed For:**
- ⚠️ Training endpoints (not fully exposed by SDK)
- ⚠️ Custom parameters (SDK doesn't support all options)
- ⚠️ Debugging (need to see raw HTTP requests/responses)

**Our Solution:**
```python
# Use SDK where possible
dataset = client.api.datasets.upload(...)  # ✅ SDK

# Fall back to REST when needed
response = client._client.post(...)  # ⚠️ REST

# But always use SDK auth
headers=client.auth_headers  # ✅ SDK provides auth
```

---

## 📊 Model Management

### Versioning Strategy

We use **semantic versioning** for models:

```
demand_forecast_v1.0   →  Initial model
demand_forecast_v1.1   →  Bug fix / minor update
demand_forecast_v2.0   →  Major architecture change
```

### Model Promotion

**File**: `model_promotion.py`

We implement **A/B testing** and **metric-based promotion**:

```python
def promote_model(new_model_metrics: ModelMetrics, 
                  old_model_metrics: ModelMetrics) -> bool:
    """
    Decide whether to promote new model to production
    
    Criteria:
    - New model must have better metrics
    - Improvement must be statistically significant
    - New model must pass validation checks
    """
    if new_model_metrics.usecase == "prediction":
        # For regression: lower MAE/RMSE is better
        return (new_model_metrics.metrics['mae'] < 
                old_model_metrics.metrics['mae'] * 0.95)  # 5% improvement
    
    elif new_model_metrics.usecase == "clustering":
        # For clustering: higher silhouette score is better
        return (new_model_metrics.metrics['silhouette'] > 
                old_model_metrics.metrics['silhouette'] * 1.02)  # 2% improvement
```

### Model Registry

We track deployed models in memory (can be persisted to database):

```python
CURRENT_PREDICTION_MODEL = "model_abc123"  # Production model ID
CURRENT_CLUSTERING_MODEL = "model_xyz789"
CURRENT_ANOMALY_MODEL = "model_def456"
```

---

## 📁 Files Overview

| File | Purpose | Key Functions |
|------|---------|---------------|
| **`model_train_and_inference`** | Main training pipeline | `upload_dataset()`, `train_model()`, `wait_for_training()`, `run_inference()` |
| **`model_mangement.py`** | Model lifecycle management | `woodwide_oneshot()` - train, evaluate, promote |
| **`model_promotion.py`** | Model evaluation & promotion | `calculate_model_metrics()`, `compare_models()` |
| **`prediction-model.py`** | Demand forecasting | Prediction-specific training logic |
| **`clustering-model.py`** | Drug clustering | Clustering-specific training logic |
| **`anomaly-model.py`** | Anomaly detection | Anomaly detection logic |
| **`supabase_export_import.py`** | Data pipeline | Export from Supabase, import results |
| **`testing.py`** | Integration tests | End-to-end testing |

---

## 🚀 Usage Examples

### Example 1: Train Demand Forecast Model (Prediction Use Case)

**Scenario**: You want to predict next week's medication demand based on historical usage.

**Python Script**:
```python
from model_train_and_inference import woodwide_run
import os

# Set your API key
os.environ["WOODWIDE_API_KEY"] = "ww_your_api_key_here"

# Run end-to-end workflow
result = woodwide_run(
    usecase="prediction",
    api_key=os.getenv("WOODWIDE_API_KEY"),
    model_name="demand_forecast_v5",
    dataset_name="pharmacy_inventory_jan2026",
    data_path="./mock_medicine_inventory_timeseries.csv",
    label_column="units_used_next_week",  # What we're predicting
    output_file="predictions_jan2026.csv",
    cleanup_temp_files=True  # Delete temp train/test files
)

print(f"✅ Model trained: {result.model_id}")
print(f"✅ Predictions saved to: predictions_jan2026.csv")
```

**Expected Output**:
```
Loading dataset from: ./mock_medicine_inventory_timeseries.csv
Data prepared successfully.
Label column: 'units_used_next_week'
Train shape: (800, 12)
Test shape:  (200, 12)

Uploading pharmacy_train.csv as 'pharmacy_inventory_jan2026'...
Upload took 1.23s
Dataset Uploaded. ID: dataset_abc123

Training Prediction Model 'demand_forecast_v5'...
Training request took 0.45s
Model Training Started. ID: model_ghi789

Waiting for model model_ghi789 to complete training...
Status: TRAINING. Waiting...
Training complete in 142.34s

Running inference on model model_ghi789...
Inference completed in 3.21s

✅ Model trained: model_ghi789
✅ Predictions saved to: predictions_jan2026.csv
```

### Example 2: Cluster Drugs by Usage Pattern (Clustering Use Case)

```python
from model_train_and_inference import woodwide_run
import os

result = woodwide_run(
    usecase="clustering",  # Different use case
    api_key=os.getenv("WOODWIDE_API_KEY"),
    model_name="drug_clusters_by_usage_v2",
    dataset_name="drug_features_jan2026",
    data_path="./entries_inventory.csv",
    label_column="",  # Not needed for clustering
    output_file="cluster_assignments.csv"
)

print(f"✅ Clustering model: {result.model_id}")
print(f"✅ Clusters saved to: cluster_assignments.csv")
```

### Example 3: Full Model Lifecycle with Promotion

```python
from model_mangement import woodwide_oneshot
from woodwide import WoodWide
import os

client = WoodWide(
    api_key=os.getenv("WOODWIDE_API_KEY"),
    base_url="https://beta.woodwide.ai/"
)

# Train, evaluate, and potentially promote
result = woodwide_oneshot(
    client=client,
    usecase="prediction",
    api_key=os.getenv("WOODWIDE_API_KEY"),
    model_name="demand_forecast_v6",  # New version
    dataset_name="latest_inventory",
    data_path="./daily_inventory.csv",
    label_column="future_demand",
    output_file="latest_predictions.csv"
)

print(f"Model trained: {result.model_id}")
print(f"Metrics: {result.metrics}")

if result.promoted:
    print("✅ New model promoted to production!")
else:
    print("⚠️ Old model still better, keeping it in production")
```

---

## 🐛 Troubleshooting

### Common API Integration Issues

#### Issue 1: Authentication Errors

**Error Message**: `RuntimeError: Training failed (401): {"error": "Invalid API key"}`

**Solutions**:
```python
# ✅ Check if API key is set
import os
print(os.getenv("WOODWIDE_API_KEY"))  # Should print "ww_..."

# ✅ Verify API key format
api_key = os.getenv("WOODWIDE_API_KEY")
assert api_key.startswith("ww_"), "API key should start with 'ww_'"
```

#### Issue 2: Dataset Upload Fails

**Error Message**: `ValueError: Label column 'future_demand' not found in dataset`

**Solutions**:
```python
# ✅ Check CSV columns before upload
import pandas as pd
df = pd.read_csv("your_data.csv")
print(f"Columns: {list(df.columns)}")

# ✅ Verify label column exists
label_column = "future_demand"
assert label_column in df.columns, f"Column '{label_column}' not found"
```

#### Issue 3: Training Timeout

**Error Message**: `TimeoutError: Model training timed out`

**Solutions**:
```python
# ✅ Increase timeout (default: 3000s = 50 min)
from model_train_and_inference import wait_for_training

wait_for_training(
    client=client,
    model_id=model_id,
    timeout_s=7200,  # 2 hours for large datasets
    poll_s=5         # Poll every 5 seconds
)
```

#### Issue 4: SDK vs REST Confusion

**Error**: `AttributeError: 'WoodWide' object has no attribute 'train'`

**Solution**: Use direct REST for training:
```python
# ❌ WRONG - SDK doesn't expose train() directly
client.train(model_name="my_model")  # This doesn't exist!

# ✅ RIGHT - Use direct REST call
response = client._client.post(
    "/api/models/prediction/train",
    params={"dataset_name": "my_data"},
    data={
        "model_name": "my_model",
        "label_column": "demand",
        "overwrite": "true"
    },
    headers=client.auth_headers  # Don't forget auth!
)
```

---

## ✅ Best Practices

### Data Quality

1. **Clean data** before uploading
   - Remove nulls/outliers
   - Normalize date formats
   - Validate column types

2. **Feature engineering**
   - Include temporal features (day_of_week, month, season)
   - Add derived metrics (usage_velocity, stock_ratio)
   - Encode categorical variables

3. **Train/test split**
   - Use time-based splits (not random) for time series
   - Typical: 80% train, 20% test

### Model Training

1. **Start simple** - Train baseline model first
2. **Iterate quickly** - Wood Wide handles complexity
3. **Monitor metrics** - Track MAE, RMSE, accuracy over time
4. **Version control** - Keep old models for rollback

### Production Deployment

1. **A/B testing** - Compare new vs. old model
2. **Gradual rollout** - Deploy to subset of pharmacies first
3. **Monitoring** - Alert on prediction errors or drift
4. **Fallback** - Always have a backup model

---

## 📖 Quick Reference Card

### API Integration Cheat Sheet

```python
# ============================================
# INITIALIZATION
# ============================================
from woodwide import WoodWide
import os

client = WoodWide(
    api_key=os.getenv("WOODWIDE_API_KEY"),
    base_url="https://beta.woodwide.ai/"
)

# ============================================
# UPLOAD DATASET (SDK)
# ============================================
with open("data.csv", "rb") as f:
    dataset = client.api.datasets.upload(
        file=f,
        name="my_dataset",
        overwrite=True
    )
dataset_id = dataset.id

# ============================================
# TRAIN MODEL (REST)
# ============================================
# For PREDICTION:
response = client._client.post(
    "/api/models/prediction/train",
    params={"dataset_name": "my_dataset"},
    data={
        "model_name": "my_model_v1",
        "label_column": "target",
        "overwrite": "true"
    },
    headers=client.auth_headers
)

# For CLUSTERING:
response = client._client.post(
    "/api/models/clustering/train",
    params={"dataset_name": "my_dataset"},
    data={
        "model_name": "my_clusters_v1",
        "overwrite": "true"
    },
    headers=client.auth_headers
)

model_id = response.json()["id"]

# ============================================
# WAIT FOR TRAINING (SDK)
# ============================================
import time

while True:
    model = client.api.models.retrieve(model_id)
    if model.training_status == "COMPLETE":
        break
    elif model.training_status == "FAILED":
        raise RuntimeError("Training failed")
    time.sleep(2)

# ============================================
# RUN INFERENCE (SDK)
# ============================================
# For PREDICTION:
result = client.api.models.prediction.infer(
    model_id=model_id,
    dataset_id=test_dataset_id
)

# For CLUSTERING:
result = client.api.models.clustering.infer(
    model_id=model_id,
    dataset_id=test_dataset_id
)
```

### Common Patterns

#### Pattern 1: One-Line Training
```python
from model_train_and_inference import woodwide_run
result = woodwide_run(usecase="prediction", api_key="...", model_name="...", 
                      dataset_name="...", data_path="...", label_column="...")
```

#### Pattern 2: Train + Promote
```python
from model_mangement import woodwide_oneshot
result = woodwide_oneshot(client=client, usecase="prediction", ...)
if result.promoted:
    print("New model in production!")
```

---

## ✨ Summary

MedShare leverages **Wood Wide AI** to deliver **intelligent pharmacy inventory management**:

✅ **Hybrid Integration** - SDK methods + direct REST API for maximum flexibility  
✅ **Single Entrypoint** - All workflows through `woodwide_run()` for consistency  
✅ **Production Ready** - Error handling, retries, and automatic cleanup  
✅ **Model Lifecycle** - Version control, A/B testing, and promotion logic  
✅ **Fast Iteration** - Train and deploy in minutes with minimal code  

**Our Approach**:
1. Use Wood Wide's Python SDK for well-supported operations (upload, inference)
2. Use direct REST API calls for training endpoints (not fully exposed by SDK)
3. Always authenticate via `client.auth_headers` from the SDK
4. Poll training status every 2-5 seconds until complete
5. Handle errors gracefully with timeouts and retries

**Result**: Pharmacies get AI-powered demand forecasting, intelligent clustering, and anomaly detection without needing ML expertise! 🎉

---

## 📚 Resources

- **Wood Wide Documentation**: https://docs.woodwide.ai/
- **Wood Wide Dashboard**: https://beta.woodwide.ai/
- **Python SDK**: `pip install woodwide`
- **Support**: support@woodwide.ai

---

**Last Updated**: January 18, 2026  
**Maintained By**: MedShare Development Team  
**Wood Wide Version**: Beta (https://beta.woodwide.ai/)  
**Integration Type**: Hybrid (SDK + REST API)
