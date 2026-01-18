# model_promotion.py

from __future__ import annotations

import io
import math
from dataclasses import dataclass
from typing import Any, Callable, Optional, Sequence, Literal

import pandas as pd

UseCase = Literal["prediction", "clustering"]

PredictionColumnResolver = Callable[
    [pd.DataFrame, pd.DataFrame, Optional[str]],  # (pred_df, test_df, label_column)
    str
]


# -------------------------
# Metrics objects
# -------------------------

@dataclass(frozen=True)
class ModelMetrics:
    usecase: str
    task_type: str  # "regression" | "classification" | "clustering"
    n_rows: int
    label_column: Optional[str]
    prediction_column: Optional[str]
    metrics: dict[str, float]


# -------------------------
# Inference CSV parsing
# -------------------------

def parse_woodwide_inference_csv(inference_csv: Any) -> pd.DataFrame:
    if isinstance(inference_csv, pd.DataFrame):
        return inference_csv

    if isinstance(inference_csv, bytes):
        return pd.read_csv(io.BytesIO(inference_csv))

    if isinstance(inference_csv, str):
        return pd.read_csv(io.StringIO(inference_csv))

    if hasattr(inference_csv, "read"):
        raw = inference_csv.read()
        if isinstance(raw, bytes):
            return pd.read_csv(io.BytesIO(raw))
        return pd.read_csv(io.StringIO(str(raw)))

    raise TypeError(
        f"Unsupported inference CSV type: {type(inference_csv)}. "
        "Expected str/bytes/file-like/DataFrame."
    )


# -------------------------
# Dynamic prediction column selection
# -------------------------

def resolve_prediction_column(
    pred_df: pd.DataFrame,
    test_df: pd.DataFrame,
    label_column: Optional[str],
    *,
    prediction_column: Optional[str] = None,
    prediction_column_candidates: Optional[Sequence[str]] = None,
    prediction_column_resolver: Optional[PredictionColumnResolver] = None,
) -> str:
    """
    Resolution order:
      1) prediction_column_resolver (user-provided callable)
      2) prediction_column (explicit)
      3) prediction_column_candidates (priority-ordered list)
      4) auto-detect heuristics
    """
    if prediction_column_resolver is not None:
        col = prediction_column_resolver(pred_df, test_df, label_column)
        if col not in pred_df.columns:
            raise ValueError(
                f"prediction_column_resolver returned '{col}', but it is not in inference columns: "
                f"{list(pred_df.columns)}"
            )
        return col

    if prediction_column is not None:
        if prediction_column not in pred_df.columns:
            raise ValueError(
                f"prediction_column='{prediction_column}' not found in inference columns: "
                f"{list(pred_df.columns)}"
            )
        return prediction_column

    if prediction_column_candidates:
        # try exact and case-insensitive matches
        lower_map = {c.lower(): c for c in pred_df.columns}
        for cand in prediction_column_candidates:
            if cand in pred_df.columns:
                return cand
            if cand.lower() in lower_map:
                return lower_map[cand.lower()]

    # Heuristics:
    # A) common names
    common = [
        "prediction", "predictions", "y_pred", "pred", "output", "outputs", "score", "value"
    ]
    lower_map = {c.lower(): c for c in pred_df.columns}
    for c in common:
        if c in lower_map:
            return lower_map[c]

    # B) columns containing 'pred'
    pred_like = [c for c in pred_df.columns if "pred" in c.lower()]
    if len(pred_like) == 1:
        return pred_like[0]
    if len(pred_like) > 1:
        # if multiple, prefer the shortest (often "pred" or "prediction") as a heuristic
        return sorted(pred_like, key=len)[0]

    # C) numeric column fallback (excluding obvious IDs)
    numeric_cols = [
        c for c in pred_df.columns
        if pd.api.types.is_numeric_dtype(pred_df[c]) and "id" not in c.lower()
    ]
    if len(numeric_cols) == 1:
        return numeric_cols[0]

    raise ValueError(
        "Unable to resolve prediction column dynamically. Provide one of: "
        "prediction_column, prediction_column_candidates, or prediction_column_resolver. "
        f"Inference columns: {list(pred_df.columns)}"
    )


# -------------------------
# Task-type inference
# -------------------------

def infer_task_type(y_true: pd.Series) -> str:
    y = y_true.dropna()
    if y.empty:
        return "regression"
    is_numeric = pd.api.types.is_numeric_dtype(y)
    nunique = y.nunique(dropna=True)
    if is_numeric and nunique > max(20, int(0.05 * len(y))):
        return "regression"
    return "classification"


# -------------------------
# Metrics (no sklearn)
# -------------------------

def regression_metrics(y_true: pd.Series, y_pred: pd.Series) -> dict[str, float]:
    yt = y_true.astype(float).reset_index(drop=True)
    yp = y_pred.astype(float).reset_index(drop=True)

    n = min(len(yt), len(yp))
    yt = yt.iloc[:n]
    yp = yp.iloc[:n]

    err = yp - yt
    mae = float(err.abs().mean())
    mse = float((err ** 2).mean())
    rmse = float(math.sqrt(mse))

    yt_mean = float(yt.mean())
    ss_res = float(((yt - yp) ** 2).sum())
    ss_tot = float(((yt - yt_mean) ** 2).sum())
    r2 = float("nan") if ss_tot == 0 else float(1 - ss_res / ss_tot)

    denom = yt.abs().replace(0, pd.NA)
    mape = float(((err.abs() / denom).dropna()).mean() * 100) if denom.notna().any() else float("nan")

    smape_denom = (yt.abs() + yp.abs()).replace(0, pd.NA)
    smape = float(((2 * err.abs() / smape_denom).dropna()).mean() * 100) if smape_denom.notna().any() else float("nan")

    return {"mae": mae, "rmse": rmse, "mse": mse, "r2": r2, "mape_pct": mape, "smape_pct": smape}


def _safe_div(num: float, den: float) -> float:
    return float("nan") if den == 0 else float(num / den)


def classification_metrics(y_true: pd.Series, y_pred: pd.Series) -> dict[str, float]:
    yt = y_true.astype(str).reset_index(drop=True)
    yp = y_pred.astype(str).reset_index(drop=True)

    n = min(len(yt), len(yp))
    yt = yt.iloc[:n]
    yp = yp.iloc[:n]

    accuracy = float((yt == yp).mean())

    labels = sorted(set(yt.unique()) | set(yp.unique()))
    cm = pd.crosstab(yt, yp, dropna=False).reindex(index=labels, columns=labels, fill_value=0)

    precisions, recalls, f1s = [], [], []
    for lbl in labels:
        tp = float(cm.loc[lbl, lbl])
        fp = float(cm[lbl].sum() - tp)
        fn = float(cm.loc[lbl].sum() - tp)

        p = _safe_div(tp, tp + fp)
        r = _safe_div(tp, tp + fn)
        f1 = float("nan") if (math.isnan(p) or math.isnan(r) or (p + r) == 0) else float(2 * p * r / (p + r))

        precisions.append(p)
        recalls.append(r)
        f1s.append(f1)

    return {
        "accuracy": accuracy,
        "macro_precision": float(pd.Series(precisions).mean()),
        "macro_recall": float(pd.Series(recalls).mean()),
        "macro_f1": float(pd.Series(f1s).mean()),
        "n_classes": float(len(labels)),
    }


# -------------------------
# Public: metric calculator
# -------------------------

def calculate_model_metrics_from_csv_response(
    *,
    usecase: UseCase,
    inference_csv: Any,
    test_csv_path: str,
    label_column: Optional[str],
    prediction_column: Optional[str] = None,
    prediction_column_candidates: Optional[Sequence[str]] = None,
    prediction_column_resolver: Optional[PredictionColumnResolver] = None,
) -> ModelMetrics:
    test_df = pd.read_csv(test_csv_path)
    n_test = len(test_df)

    if usecase == "clustering":
        pred_df = parse_woodwide_inference_csv(inference_csv)
        return ModelMetrics(
            usecase=usecase,
            task_type="clustering",
            n_rows=min(n_test, len(pred_df)),
            label_column=None,
            prediction_column=None,
            metrics={"n_rows": float(min(n_test, len(pred_df)))},
        )

    if not label_column:
        raise ValueError("label_column is required for prediction metrics")
    if label_column not in test_df.columns:
        raise ValueError(f"Label column '{label_column}' not found in test CSV")

    pred_df = parse_woodwide_inference_csv(inference_csv)

    pred_col = resolve_prediction_column(
        pred_df,
        test_df,
        label_column,
        prediction_column=prediction_column,
        prediction_column_candidates=prediction_column_candidates,
        prediction_column_resolver=prediction_column_resolver,
    )

    y_true = test_df[label_column]
    y_pred = pred_df[pred_col]

    task_type = infer_task_type(y_true)
    metrics = regression_metrics(y_true, y_pred) if task_type == "regression" else classification_metrics(y_true, y_pred)

    n_rows = min(len(y_true), len(y_pred))
    return ModelMetrics(
        usecase=usecase,
        task_type=task_type,
        n_rows=n_rows,
        label_column=label_column,
        prediction_column=pred_col,
        metrics=metrics,
    )


# -------------------------
# Public: compare two models
# -------------------------

def compare_model_metrics_two_models(
    *,
    client,  # WoodWide
    model_id_a: str,
    model_id_b: str,
    test_dataset_id: str,
    test_csv_path: str,
    usecase: UseCase = "prediction",
    label_column: Optional[str] = None,
    prediction_column: Optional[str] = None,
    prediction_column_candidates: Optional[Sequence[str]] = None,
    prediction_column_resolver: Optional[PredictionColumnResolver] = None,
) -> pd.DataFrame:
    if usecase == "clustering":
        inf_a = client.api.models.clustering.infer(model_id=model_id_a, dataset_id=test_dataset_id)
        inf_b = client.api.models.clustering.infer(model_id=model_id_b, dataset_id=test_dataset_id)
    else:
        inf_a = client.api.models.prediction.infer(model_id=model_id_a, dataset_id=test_dataset_id)
        inf_b = client.api.models.prediction.infer(model_id=model_id_b, dataset_id=test_dataset_id)

    met_a = calculate_model_metrics_from_csv_response(
        usecase=usecase,
        inference_csv=inf_a,
        test_csv_path=test_csv_path,
        label_column=label_column,
        prediction_column=prediction_column,
        prediction_column_candidates=prediction_column_candidates,
        prediction_column_resolver=prediction_column_resolver,
    )
    met_b = calculate_model_metrics_from_csv_response(
        usecase=usecase,
        inference_csv=inf_b,
        test_csv_path=test_csv_path,
        label_column=label_column,
        prediction_column=prediction_column,
        prediction_column_candidates=prediction_column_candidates,
        prediction_column_resolver=prediction_column_resolver,
    )

    # Comparison table: metric | a | b | delta
    all_metrics = sorted(set(met_a.metrics) | set(met_b.metrics))
    rows = []
    for m in all_metrics:
        a = met_a.metrics.get(m, float("nan"))
        b = met_b.metrics.get(m, float("nan"))
        delta = float("nan") if (pd.isna(a) or pd.isna(b)) else float(b - a)
        rows.append({"metric": m, "model_a": a, "model_b": b, "delta_(b-a)": delta})

    return pd.DataFrame(rows).sort_values("metric").reset_index(drop=True)

