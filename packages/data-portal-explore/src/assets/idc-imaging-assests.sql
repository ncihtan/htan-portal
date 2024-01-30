SELECT
    DISTINCT(collection_id),
    ContainerIdentifier,
    CONCAT("cp s3",REGEXP_SUBSTR(gcs_url, "(://.*)/"),"/* .") AS s5cmd_manifest_gcp,
    CONCAT("cp s3",REGEXP_SUBSTR(aws_url, "(://.*)/"),"/* .") AS s5cmd_manifest_aws,
    CONCAT("https://viewer.imaging.datacommons.cancer.gov/slim/studies/", StudyInstanceUID , "/series/", SeriesInstanceUID) AS viewer_url
FROM
    `bigquery-public-data.idc_current.dicom_all` AS dicom_all
WHERE
    collection_id LIKE "htan%" and Modality="SM"
ORDER BY
    collection_id ASC
