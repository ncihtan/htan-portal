#!/usr/bin/env bash
set -euo pipefail

PROJECT_ID="htan2-dcc"
DATASET="htan2_data_portal"
GCS_BUCKET="gs://htan2-data-portal-files"
LOCAL_OUT_DIR="data"
MODE="${MODE:-local}" # local | gcs
SQL_FILE="${SQL_FILE:-bigquery_to_clickhouse.sql}" # bigquery_to_clickhouse.sql | bigquery_to_clickhouse_silver.sql
SKIP_SQL="${SKIP_SQL:-false}" # Set to true to skip SQL view creation

TABLES=(
  "atlases"
  "cases"
  "demographics"
  "diagnosis"
  "files"
  "specimen"
)

cleanup_tmp_table() {
  local table_ref="$1"
  bq rm -f -t "$table_ref" >/dev/null 2>&1 || true
}

mkdir -p "${LOCAL_OUT_DIR}"

if [[ "${MODE}" != "local" && "${MODE}" != "gcs" ]]; then
  echo "Invalid MODE='${MODE}'. Use MODE=local or MODE=gcs."
  exit 1
fi

# ============================================================
# Step 1: Create BigQuery views from SQL file (if not skipped)
# ============================================================
if [[ "${SKIP_SQL}" != "true" ]]; then
  echo "Creating BigQuery views from ${SQL_FILE}..."

  if [[ ! -f "${SQL_FILE}" ]]; then
    echo "ERROR: SQL file '${SQL_FILE}' not found!"
    exit 1
  fi

  # Execute each CREATE OR REPLACE VIEW statement
  bq query \
    --project_id="${PROJECT_ID}" \
    --use_legacy_sql=false \
    "$(cat "${SQL_FILE}")" || {
    echo "ERROR: Failed to create views from ${SQL_FILE}"
    exit 1
  }

  echo "✓ BigQuery views created successfully."
else
  echo "⊘ Skipping SQL view creation (SKIP_SQL=true)."
fi

echo ""

# ============================================================
# Step 2: Export data tables to local files
# ============================================================

for name in "${TABLES[@]}"; do
  src_ref="${PROJECT_ID}.${DATASET}.${name}"
  local_file="${LOCAL_OUT_DIR}/htan2_${name}.json"
  gcs_file="${GCS_BUCKET}/${name}.json"

  # Always materialize first to ensure views are fully resolved
  # (especially important for views with JOINs)
  tmp_name="tmp_export_${name}_$(date +%s)_$RANDOM"
  tmp_ref="${PROJECT_ID}:${DATASET}.${tmp_name}"

  echo "Materializing ${src_ref} -> ${tmp_ref}"
  bq query \
    --project_id="${PROJECT_ID}" \
    --use_legacy_sql=false \
    --replace \
    --destination_table="${tmp_ref}" \
    "SELECT * FROM \`${src_ref}\`"

  if [[ "${MODE}" == "local" ]]; then
    echo "Exporting ${tmp_ref} -> ${local_file}"
    bq query \
      --project_id="${PROJECT_ID}" \
      --use_legacy_sql=false \
      --format=prettyjson \
      "SELECT * FROM \`${PROJECT_ID}.${DATASET}.${tmp_name}\`" > "${local_file}"

    # Verify the file is not empty
    if [[ ! -s "${local_file}" ]]; then
      echo "ERROR: ${local_file} is empty after export!"
      cleanup_tmp_table "${tmp_ref}"
      exit 1
    fi
  else
    echo "Extracting ${tmp_ref} -> ${gcs_file}"
    bq extract \
      --project_id="${PROJECT_ID}" \
      --destination_format=NEWLINE_DELIMITED_JSON \
      "${DATASET}.${tmp_name}" \
      "${gcs_file}"

    echo "Downloading ${gcs_file} -> ${local_file}"
    gsutil cp "${gcs_file}" "${local_file}"

    # Verify the file is not empty
    if [[ ! -s "${local_file}" ]]; then
      echo "ERROR: ${local_file} is empty after download!"
      cleanup_tmp_table "${tmp_ref}"
      exit 1
    fi
  fi

  cleanup_tmp_table "${tmp_ref}"
done
