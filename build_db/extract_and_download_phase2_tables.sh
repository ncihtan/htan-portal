#!/usr/bin/env bash
set -euo pipefail

PROJECT_ID="htan2-dcc"
DATASET="htan2_data_portal"
GCS_BUCKET="gs://htan2-data-portal-files"
LOCAL_OUT_DIR="data"
MODE="${MODE:-local}" # local | gcs

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

for name in "${TABLES[@]}"; do
  src_ref="${PROJECT_ID}.${DATASET}.${name}"
  local_file="${LOCAL_OUT_DIR}/htan2_${name}.json"
  gcs_file="${GCS_BUCKET}/${name}.json"

  if [[ "${MODE}" == "local" ]]; then
    echo "Querying ${src_ref} -> ${local_file}"
    bq query \
      --project_id="${PROJECT_ID}" \
      --use_legacy_sql=false \
      --format=prettyjson \
      "SELECT * FROM \`${src_ref}\`" > "${local_file}"
  else
    tmp_name="tmp_export_${name}_$(date +%s)_$RANDOM"
    tmp_ref="${PROJECT_ID}:${DATASET}.${tmp_name}"

    echo "Materializing ${src_ref} -> ${tmp_ref}"
    # Materialize first so exports also work when source is a VIEW.
    bq query \
      --project_id="${PROJECT_ID}" \
      --use_legacy_sql=false \
      --replace \
      --destination_table="${tmp_ref}" \
      "SELECT * FROM \`${src_ref}\`"

    echo "Extracting ${tmp_ref} -> ${gcs_file}"
    bq extract \
      --project_id="${PROJECT_ID}" \
      --destination_format=NEWLINE_DELIMITED_JSON \
      "${DATASET}.${tmp_name}" \
      "${gcs_file}"

    echo "Downloading ${gcs_file} -> ${local_file}"
    gsutil cp "${gcs_file}" "${local_file}"

    cleanup_tmp_table "${tmp_ref}"
  fi
done
