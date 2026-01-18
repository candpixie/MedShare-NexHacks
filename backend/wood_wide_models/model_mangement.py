# model_management.py


from woodwide import WoodWide
from model_train_and_inference import *
from model_promotion import *

# train new model on trigger and decide whether to promote and save the inference or not

CURRENT_PREDICTION_MODEL = None
CURRENT_CLUSTERING_MODEL = None
CURRENT_ANOMALY_MODEL = None

DEFAULT_BASE_URL = "https://beta.woodwide.ai/"


# ------------------------------------------------------------
def woodwide_oneshot(
    client: WoodWide,
    usecase: str,
    api_key: str,
    model_name: str,
    dataset_name: str,
    data_path: str,
    base_url: str = DEFAULT_BASE_URL,
    output_file: Optional[str] = None,
    label_column: Optional[str] = None,
    cleanup_temp_files: bool = True,
):
    # train, inference, and promote best model
    # train and infer via model_train_and_inference.woodwide_run()
    print("Starting WoodWide oneshot run...")

    # train and inference on new model

    new_model_result = woodwide_run(
        usecase=usecase,
        model_name=model_name,
        dataset_name=dataset_name,
        data_path=data_path,
        label_column=label_column,
        api_key=api_key,
        base_url=base_url,
        test_csv_path="pharmacy_test.csv",
        #output_file=output_file,
        cleanup_temp_files=cleanup_temp_files,
    )

    # compare the new model with the old one if it exists
    if usecase == "prediction" and CURRENT_PREDICTION_MODEL is not None:
        
        MODEL_ID = new_model_result.model_id  # e.g. from training output

        old_metrics = calculate_model_metrics_from_csv_response(
            usecase="prediction",
            inference_csv=client.api.models.prediction.infer(
                model_id=MODEL_ID,
                dataset_id=test_dataset_id,
            ),
            test_csv_path=test_csv_path,
            label_column="current_on_hand_units",
        )

    elif usecase == "clustering" and CURRENT_CLUSTERING_MODEL is not None:
        old_metrics = calculate_model_metrics_from_csv_response(
            usecase=usecase,
            inference_csv=client.api.models.prediction.infer(
                model_id=MODEL_ID,
                dataset_id=test_dataset_id,
            ),
            test_csv_path=test_csv_path,
            label_column="current_on_hand_units",
        )
    elif usecase == "anomaly_detection" and CURRENT_ANOMALY_MODEL is not None:
        old_metrics = calculate_model_metrics_from_csv_response(
            usecase=usecase,
            inference_csv=client.api.models.prediction.infer(
                model_id=MODEL_ID,
                dataset_id=test_dataset_id,
            ),
            test_csv_path=test_csv_path,
            label_column="current_on_hand_units",
        )
    else:
        with open(output_file, "w", encoding="utf-8") as f:
                f.write(format_result(new_model_result.inference_result))
        print("No existing model to compare against. New model inference results saved.")
        return
    
    met_a = calculate_model_metrics_from_csv_response(
        usecase=usecase,
        inference_csv=CURRENT_PREDICTION_MODEL.inference_result,
        test_csv_path=test_csv_path,
        label_column=label_column,
        prediction_column=prediction_column,
        prediction_column_candidates=prediction_column_candidates,
        prediction_column_resolver=prediction_column_resolver,
    )
    met_b = calculate_model_metrics_from_csv_response(
        usecase=usecase,
        inference_csv=new_model_result.inference_result,
        test_csv_path=test_csv_path,
        label_column=label_column,
        prediction_column=prediction_column,
        prediction_column_candidates=prediction_column_candidates,
        prediction_column_resolver=prediction_column_resolver,
    )

    # 3) Comparison table
    all_metrics = sorted(set(met_a.metrics) | set(met_b.metrics))
    rows: list[dict[str, Any]] = []
    for m in all_metrics:
        a = met_a.metrics.get(m, float("nan"))
        b = met_b.metrics.get(m, float("nan"))
        delta = float("nan") if (pd.isna(a) or pd.isna(b)) else float(b - a)
        rows.append({"metric": m, "model_a": a, "model_b": b, "delta_(b-a)": delta})

    df = pd.DataFrame(rows).sort_values("metric").reset_index(drop=True)

    # 4) Decide direction (higher vs lower is better)
    if higher_is_better is None:
        m = primary_metric.lower()
        lower_is_better = {
            "rmse", "mse", "mae", "mape", "smape", "logloss", "loss",
            "cross_entropy", "error", "mean_absolute_error", "mean_squared_error",
            "root_mean_squared_error",
        }
        higher_default = {
            "accuracy", "f1", "f1_score", "precision", "recall", "auc", "roc_auc",
            "r2", "silhouette", "ari", "nmi",
        }

        if m in lower_is_better:
            higher_is_better = False
        elif m in higher_default:
            higher_is_better = True
        else:
            # Unknown metric name: default to higher-is-better
            higher_is_better = True

    # 5) Make recommendation
    a_val = met_a.metrics.get(primary_metric, float("nan"))
    b_val = met_b.metrics.get(primary_metric, float("nan"))

    if pd.isna(a_val) or pd.isna(b_val):
        decision = ModelComparisonDecision(
            recommendation="keep_model_a",
            primary_metric=primary_metric,
            model_a_value=float(a_val),
            model_b_value=float(b_val),
            delta_b_minus_a=float("nan"),
            passes_threshold=False,
            reason=f"Primary metric '{primary_metric}' missing for one or both models; defaulting to keep model A.",
        )
        return df, decision

    delta_b_minus_a = float(b_val - a_val)

    if higher_is_better:
        passes = delta_b_minus_a >= float(min_improvement)
        rec: Recommendation = "upgrade_to_model_b" if passes else "keep_model_a"
        reason = (
            f"Primary metric '{primary_metric}' (higher is better). "
            f"Δ(b-a)={delta_b_minus_a:.6g} vs threshold={float(min_improvement):.6g}."
        )
    else:
        improvement = float(a_val - b_val)  # positive means B is lower (better)
        passes = improvement >= float(min_improvement)
        rec = "upgrade_to_model_b" if passes else "keep_model_a"
        reason = (
            f"Primary metric '{primary_metric}' (lower is better). "
            f"Improvement(a-b)={improvement:.6g} vs threshold={float(min_improvement):.6g}."
        )

    if Recommendation == "upgrade_to_model_b":
        with open(output_file, "w", encoding="utf-8") as f:
            f.write(format_result(new_model_result.inference_result))
        print("New model outperforms the existing model. Inference results saved to output file.")
        CURRENT_PREDICTION_MODEL = new_model_result

if "__main__" == __name__:

    