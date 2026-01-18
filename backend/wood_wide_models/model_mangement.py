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
            test_csv_path="pharmacy_test.csv",
            label_column="current_on_hand_units",
        )

        print(metrics)
        print(metrics.metrics)
    elif usecase == "clustering" and CURRENT_CLUSTERING_MODEL is not None:
        old_metrics = calculate_model_metrics_from_csv_response(
            usecase=usecase,
            inference_csv=client.api.models.prediction.infer(
                model_id=MODEL_ID,
                dataset_id=test_dataset_id,
            ),
            test_csv_path="pharmacy_test.csv",
            label_column="current_on_hand_units",
        )
    elif usecase == "anomaly_detection" and CURRENT_ANOMALY_MODEL is not None:
        old_metrics = calculate_model_metrics_from_csv_response(
            usecase=usecase,
            inference_csv=client.api.models.prediction.infer(
                model_id=MODEL_ID,
                dataset_id=test_dataset_id,
            ),
            test_csv_path="pharmacy_test.csv",
            label_column="current_on_hand_units",
        )
    else:
        with open(output_file, "w", encoding="utf-8") as f:
                f.write(format_result(new_model_result.inference_result))

if "__main__" == __name__:

    