import os
import requests

FUNCTION_URL = os.getenv("EXPORT_FUNCTION_URL", "https://<YOUR_FUNCTION_URL>/export_table_csv")
# Use a server-side secret if your function requires auth. Keep this secret out of source control.
AUTH_HEADER = os.getenv("EXPORT_FUNCTION_AUTH")  # e.g., "Bearer <SERVICE_ROLE_KEY>" or a JWT, or None

def export_table_to_csv(table_name: str, dest_path: str) -> None:
    """
    Call the export_table_csv Edge Function and save the CSV to dest_path.
    Raises requests.HTTPError for non-2xx responses.
    """
    if not table_name or not table_name.isidentifier():
        raise ValueError("Invalid table name. Use letters, digits, and underscores only.")

    headers = {"Content-Type": "application/json"}
    if AUTH_HEADER:
        headers["Authorization"] = AUTH_HEADER

    payload = {"table": table_name}

    with requests.post(FUNCTION_URL, json=payload, headers=headers, stream=True) as resp:
        try:
            resp.raise_for_status()
        except requests.HTTPError as e:
            # Surface response body for debugging (be careful with secrets)
            body = resp.text
            raise requests.HTTPError(f"Edge function returned {resp.status_code}: {body}") from e

        # Stream to file
        with open(dest_path, "wb") as f:
            for chunk in resp.iter_content(chunk_size=8192):
                if chunk:
                    f.write(chunk)

    print(f"Exported table '{table_name}' to {dest_path}")

# Example usage
if __name__ == "__main__":
    # set these in environment or replace with literal strings for quick tests
    # os.environ["EXPORT_FUNCTION_URL"] = "https://<YOUR_FUNCTION_URL>/export_table_csv"
    # os.environ["EXPORT_FUNCTION_AUTH"] = "Bearer <SERVICE_ROLE_KEY>"  # optional
    table = "my_table"
    out_file = f"{table}.csv"
    export_table_to_csv(table, out_file)