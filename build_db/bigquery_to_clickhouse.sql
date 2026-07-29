-- BigQuery SQL: Transform Phase 2 (BigQuery) data with Phase 2 column names preserved
--
-- Usage:
--   Target views are created in: htan2-dcc.htan2_data_portal
--   Execute each CREATE OR REPLACE VIEW statement in BigQuery to create views with Phase 2 column names preserved.
--   All source tables are the `gold_RELEASED_*` tables in: htan2-dcc.htan2_medallion_gold
--
-- Views created in htan2-dcc.htan2_data_portal:
--   atlases
--   demographics
--   diagnosis
--   specimen
--   cases
--   files
--   publication_manifest  (placeholder – no equivalent in Phase 2)
--
-- Regex patterns used throughout this file:
--   HTAN atlas ID prefix:  r'^(HTA[0-9]+)'
--     Matches the atlas portion of any HTAN ID (e.g. "HTA9" from "HTA9_1234_567").
--   HTAN biospecimen ID:   r'^HTA[0-9]+_[0-9]+_'
--     Distinguishes a derived biospecimen parent from a participant ID; biospecimen
--     IDs contain a second underscore-separated segment after the center number
--     (e.g. "HTA9_1_A2B3"), while participant IDs have only one (e.g. "HTA9_12").
--   Assay level suffix:    r'Level[0-9]+(?:and[0-9]+)?'
--     Extracts the processing level token from a Component value (e.g. "Level3and4").

-- ============================================================
-- VIEW: atlases
-- Phase 1 table: atlases
-- Derived from demographics and biospecimen counts per center.
-- ============================================================
CREATE OR REPLACE VIEW `htan2-dcc.htan2_data_portal.atlases` AS
WITH
  centers AS (
    SELECT
      LOWER(REGEXP_EXTRACT(HTAN_PARTICIPANT_ID, r'^(HTA[0-9]+)')) AS htan_id,
      ANY_VALUE(HTAN_Center) AS htan_name
    FROM `htan2-dcc.htan2_medallion_gold.gold_RELEASED_METADATA_TABLE_All_Records_Demographics`
    WHERE HTAN_PARTICIPANT_ID IS NOT NULL
    GROUP BY 1
  ),
  participant_counts AS (
    SELECT
      LOWER(REGEXP_EXTRACT(HTAN_PARTICIPANT_ID, r'^(HTA[0-9]+)')) AS htan_id,
      COUNT(DISTINCT HTAN_PARTICIPANT_ID) AS num_cases
    FROM `htan2-dcc.htan2_medallion_gold.gold_RELEASED_METADATA_TABLE_All_Records_Demographics`
    WHERE HTAN_PARTICIPANT_ID IS NOT NULL
    GROUP BY 1
  ),
  biospecimen_counts AS (
    SELECT
      LOWER(REGEXP_EXTRACT(HTAN_BIOSPECIMEN_ID, r'^(HTA[0-9]+)')) AS htan_id,
      COUNT(DISTINCT HTAN_BIOSPECIMEN_ID) AS num_biospecimens
    FROM `htan2-dcc.htan2_medallion_gold.gold_RELEASED_METADATA_TABLE_All_Records_Biospecimen`
    WHERE HTAN_BIOSPECIMEN_ID IS NOT NULL
    GROUP BY 1
  )
SELECT
  c.htan_id,
  c.htan_name,
  CAST(COALESCE(bc.num_biospecimens, 0) AS STRING) AS num_biospecimens,
  CAST(COALESCE(pc.num_cases, 0) AS STRING) AS num_cases
FROM centers c
LEFT JOIN participant_counts pc USING (htan_id)
LEFT JOIN biospecimen_counts bc USING (htan_id);


-- ============================================================
-- VIEW: demographics
-- Phase 1 table: demographics
-- Source: Demographics + VitalStatus records.
-- Trimmed to the demographics and vital-status fields still used downstream.
--   synapseId <- Record_EntityId
--   Vital status fields come from the VitalStatus table via LEFT JOIN.
-- ============================================================
CREATE OR REPLACE VIEW `htan2-dcc.htan2_data_portal.demographics` AS
SELECT
  d.Component,
  d.HTAN_PARTICIPANT_ID,
  d.ETHNIC_GROUP,
  d.GENDER_IDENTITY,
  d.SEX,
  d.RACE,
  COALESCE(vs.VITAL_STATUS, '')                                    AS VITAL_STATUS,
  d.Record_EntityId                                                AS synapseId,
  COALESCE(vs.CAUSE_OF_DEATH, '')                                  AS CAUSE_OF_DEATH,
  COALESCE(vs.CAUSE_OF_DEATH_SOURCE, '')                           AS CAUSE_OF_DEATH_SOURCE,
  COALESCE(vs.AGE_IN_DAYS_AT_DEATH, '')                            AS AGE_IN_DAYS_AT_DEATH,
  COALESCE(vs.AGE_IN_DAYS_AT_LAST_KNOWN_SURVIVAL_STATUS, '')       AS AGE_IN_DAYS_AT_LAST_KNOWN_SURVIVAL_STATUS,
  LOWER(REGEXP_EXTRACT(d.HTAN_PARTICIPANT_ID, r'^(HTA[0-9]+)'))   AS atlasid,
  d.HTAN_Center                                                    AS atlas_name
FROM `htan2-dcc.htan2_medallion_gold.gold_RELEASED_METADATA_TABLE_All_Records_Demographics` d
LEFT JOIN (
  SELECT HTAN_PARTICIPANT_ID,
         ANY_VALUE(VITAL_STATUS)         AS VITAL_STATUS,
         ANY_VALUE(CAUSE_OF_DEATH)       AS CAUSE_OF_DEATH,
         ANY_VALUE(CAUSE_OF_DEATH_SOURCE) AS CAUSE_OF_DEATH_SOURCE,
         ANY_VALUE(AGE_IN_DAYS_AT_DEATH)  AS AGE_IN_DAYS_AT_DEATH,
         ANY_VALUE(AGE_IN_DAYS_AT_LAST_KNOWN_SURVIVAL_STATUS) AS AGE_IN_DAYS_AT_LAST_KNOWN_SURVIVAL_STATUS
  FROM `htan2-dcc.htan2_medallion_gold.gold_RELEASED_METADATA_TABLE_All_Records_VitalStatus`
  GROUP BY HTAN_PARTICIPANT_ID
) vs ON d.HTAN_PARTICIPANT_ID = vs.HTAN_PARTICIPANT_ID;


-- ============================================================
-- VIEW: diagnosis
-- Phase 1 table: diagnosis
-- Source: Diagnosis + Therapy + MolecularTest records.
-- Trimmed to the diagnosis, therapy, and molecular-test fields still used downstream.
--   TREATMENT_TYPE is aggregated from Therapy records.
--   GENE_SYMBOL / MOLECULAR_ANALYSIS_METHOD / TEST_RESULT come from MolecularTest.
-- ============================================================
CREATE OR REPLACE VIEW `htan2-dcc.htan2_data_portal.diagnosis` AS
WITH
  therapy_agg AS (
    SELECT
      HTAN_PARTICIPANT_ID,
      ARRAY_AGG(DISTINCT TREATMENT_TYPE IGNORE NULLS) AS TREATMENT_TYPE
    FROM `htan2-dcc.htan2_medallion_gold.gold_RELEASED_METADATA_TABLE_All_Records_Therapy`
    GROUP BY HTAN_PARTICIPANT_ID
  ),
  molecular_agg AS (
    SELECT
      HTAN_PARTICIPANT_ID,
      ANY_VALUE(GENE_SYMBOL)             AS GENE_SYMBOL,
      ANY_VALUE(MOLECULAR_ANALYSIS_METHOD) AS MOLECULAR_ANALYSIS_METHOD,
      ANY_VALUE(TEST_RESULT)             AS TEST_RESULT
    FROM `htan2-dcc.htan2_medallion_gold.gold_RELEASED_METADATA_TABLE_All_Records_MolecularTest`
    GROUP BY HTAN_PARTICIPANT_ID
  ),
  uberon_map AS (
    SELECT
      TISSUE_OR_ORGAN_OF_ORIGIN_UBERON_CODE,
      ANY_VALUE(TISSUE_OR_ORGAN_OF_ORIGIN_UBERON_NAME) AS TISSUE_OR_ORGAN_OF_ORIGIN_UBERON_NAME
    FROM `htan2-dcc.htan2_data_mapping_tables.HTAN2_Mapping_Uberon_to_Organ`
    GROUP BY TISSUE_OR_ORGAN_OF_ORIGIN_UBERON_CODE
  ),
  diagnosis_name_map AS (
    SELECT
      PRIMARY_DIAGNOSIS_NCI_THESAURUS_ID,
      ANY_VALUE(PRIMARY_DIAGNOSIS_NCI_THESAURUS_NAME) AS PRIMARY_DIAGNOSIS_NCI_THESAURUS_NAME
    FROM `htan2-dcc.htan2_data_mapping_tables.HTAN2_Mapping_Diagnosis_to_Name`
    GROUP BY PRIMARY_DIAGNOSIS_NCI_THESAURUS_ID
  )
SELECT
  diag.Component,
  diag.HTAN_PARTICIPANT_ID AS HTAN_PARTICIPANT_ID,
  COALESCE(diag.AGE_IN_DAYS_AT_DIAGNOSIS, '')                          AS AGE_IN_DAYS_AT_DIAGNOSIS,
  COALESCE(diag.PRIMARY_DIAGNOSIS_NCI_THESAURUS_ID, '')                AS PRIMARY_DIAGNOSIS_NCI_THESAURUS_ID,
  COALESCE(dnm.PRIMARY_DIAGNOSIS_NCI_THESAURUS_NAME, '')               AS PRIMARY_DIAGNOSIS_NCI_THESAURUS_NAME,
  COALESCE(diag.TISSUE_OR_ORGAN_OF_ORIGIN_UBERON_CODE, '')             AS TISSUE_OR_ORGAN_OF_ORIGIN_UBERON_CODE,
  COALESCE(um.TISSUE_OR_ORGAN_OF_ORIGIN_UBERON_NAME, '')               AS TISSUE_OR_ORGAN_OF_ORIGIN_UBERON_NAME,
  COALESCE(diag.TUMOR_GRADE, '')                                       AS TUMOR_GRADE,
  COALESCE(diag.GLEASON_GRADE_GROUP, '')                               AS GLEASON_GRADE_GROUP,
  COALESCE(diag.LAST_KNOWN_DISEASE_STATUS, '')                         AS LAST_KNOWN_DISEASE_STATUS,
  COALESCE(diag.AGE_IN_DAYS_AT_LAST_KNOWN_DISEASE_STATUS, '')          AS AGE_IN_DAYS_AT_LAST_KNOWN_DISEASE_STATUS,
  COALESCE(diag.METHOD_OF_DIAGNOSIS, '')                               AS METHOD_OF_DIAGNOSIS,
  COALESCE(diag.METASTASIS_AT_DIAGNOSIS, '')                           AS METASTASIS_AT_DIAGNOSIS,
  COALESCE(diag.TUMOR_CLASSIFICATION_CATEGORY, '')                     AS TUMOR_CLASSIFICATION_CATEGORY,
  COALESCE(diag.CLINICAL_M_STAGE, '')                                  AS CLINICAL_M_STAGE,
  COALESCE(diag.CLINICAL_N_STAGE, '')                                  AS CLINICAL_N_STAGE,
  COALESCE(diag.TUMOR_STAGED, '')                                      AS TUMOR_STAGED,
  COALESCE(diag.CLINICAL_T_STAGE, '')                                  AS CLINICAL_T_STAGE,
  COALESCE(diag.AJCC_STAGING_SYSTEM_EDITION, '')                       AS AJCC_STAGING_SYSTEM_EDITION,
  diag.Record_EntityId                                                  AS synapseId,
  LOWER(REGEXP_EXTRACT(diag.HTAN_PARTICIPANT_ID, r'^(HTA[0-9]+)'))    AS atlasid,
  diag.HTAN_Center                                                      AS atlas_name,
  COALESCE(mol.GENE_SYMBOL, '')                                          AS GENE_SYMBOL,
  COALESCE(mol.MOLECULAR_ANALYSIS_METHOD, '')                             AS MOLECULAR_ANALYSIS_METHOD,
  COALESCE(mol.TEST_RESULT, '')                                          AS TEST_RESULT,
  COALESCE(ther.TREATMENT_TYPE, CAST([] AS ARRAY<STRING>))              AS TREATMENT_TYPE
FROM `htan2-dcc.htan2_medallion_gold.gold_RELEASED_METADATA_TABLE_All_Records_Diagnosis` diag
LEFT JOIN uberon_map um
  ON diag.TISSUE_OR_ORGAN_OF_ORIGIN_UBERON_CODE = um.TISSUE_OR_ORGAN_OF_ORIGIN_UBERON_CODE
LEFT JOIN diagnosis_name_map dnm
  ON diag.PRIMARY_DIAGNOSIS_NCI_THESAURUS_ID = dnm.PRIMARY_DIAGNOSIS_NCI_THESAURUS_ID
LEFT JOIN therapy_agg ther
  ON diag.HTAN_PARTICIPANT_ID = ther.HTAN_PARTICIPANT_ID
LEFT JOIN molecular_agg mol
  ON diag.HTAN_PARTICIPANT_ID = mol.HTAN_PARTICIPANT_ID;


-- ============================================================
-- VIEW: specimen
-- Phase 1 table: specimen
-- Source: Biospecimen records + Provenance table (for ParticipantID).
-- Trimmed to the specimen fields still used downstream.
--   SOURCE_HTAN_BIOSPECIMEN_ID <- HTAN_PARENT_ID when it is a biospecimen (contains '_')
--     Uses regex r'^HTA[0-9]+_[0-9]+_' to detect biospecimen parents vs. participant parents.
--   STORAGE_METHOD     <- PRESERVATION_MEDIUM (preferred) falling back to PRESERVATION_METHOD
--     PRESERVATION_MEDIUM is the primary Phase 2 storage-medium field; PRESERVATION_METHOD
--     is the broader preservation category used when the medium field is absent.
--   HTAN_PARTICIPANT_ID is resolved via provenance table.
-- ============================================================
CREATE OR REPLACE VIEW `htan2-dcc.htan2_data_portal.specimen` AS
SELECT
  bs.Component,
  bs.HTAN_BIOSPECIMEN_ID                                                AS HTAN_BIOSPECIMEN_ID,
  -- SOURCE_HTAN_BIOSPECIMEN_ID: the parent when the parent is another biospecimen
  IF(
    REGEXP_CONTAINS(COALESCE(bs.HTAN_PARENT_ID, ''), r'^HTA[0-9]+_[0-9]+_'),
    bs.HTAN_PARENT_ID,
    ''
  )                                                                     AS SOURCE_HTAN_BIOSPECIMEN_ID,
  bs.HTAN_PARENT_ID                                                     AS HTAN_PARENT_ID,
  COALESCE(bs.TIMEPOINT, '')                                            AS TIMEPOINT,
  COALESCE(bs.AGE_IN_DAYS_AT_SPECIMEN_COLLECTION, '')                   AS AGE_IN_DAYS_AT_SPECIMEN_COLLECTION,
  COALESCE(bs.ADJACENT_BIOSPECIMEN_IDS, '')                             AS ADJACENT_BIOSPECIMEN_IDS,
  COALESCE(bs.BIOSPECIMEN_TYPE, '')                                     AS BIOSPECIMEN_TYPE,
  COALESCE(bs.ACQUISITION_METHOD_TYPE, '')                              AS ACQUISITION_METHOD_TYPE,
  COALESCE(bs.PRESERVATION_MEDIUM, bs.PRESERVATION_METHOD, '')         AS STORAGE_METHOD,
  COALESCE(bs.AGE_IN_DAYS_AT_SPECIMEN_PROCESSING, '')                   AS AGE_IN_DAYS_AT_SPECIMEN_PROCESSING,
  COALESCE(bs.SITE_DATA_SOURCE, '')                                     AS SITE_DATA_SOURCE,
  COALESCE(bs.PROCESSING_LOCATION, '')                                  AS PROCESSING_LOCATION,
  COALESCE(bs.DEGREE_OF_DYSPLASIA, '')                                  AS DEGREE_OF_DYSPLASIA,
  COALESCE(bs.PERCENT_NECROSIS, '')                                     AS PERCENT_NECROSIS,
  COALESCE(bs.PERCENT_NORMAL_CELLS, '')                                 AS PERCENT_NORMAL_CELLS,
  COALESCE(bs.PERCENT_TUMOR_CELLS, '')                                  AS PERCENT_TUMOR_CELLS,
  COALESCE(bs.PERCENT_TUMOR_NUCLEI, '')                                 AS PERCENT_TUMOR_NUCLEI,
  COALESCE(bs.SLICING_METHOD, '')                                       AS SLICING_METHOD,
  COALESCE(bs.METHOD_OF_NUCLEIC_ACID_ISOLATION, '')                     AS METHOD_OF_NUCLEIC_ACID_ISOLATION,
  bs.Record_EntityId                                                    AS synapseId,
  COALESCE(bs.ACQUISITION_METHOD_OTHER_SPECIFY, '')                     AS ACQUISITION_METHOD_OTHER_SPECIFY,
  COALESCE(bs.ANALYTE_TYPE, '')                                         AS ANALYTE_TYPE,
  COALESCE(bs.FIXATION_DURATION_IN_MINUTES, '')                         AS FIXATION_DURATION_IN_MINUTES,
  COALESCE(bs.ICD_O_3_TISSUE_MORPHOLOGY, '')                            AS ICD_O_3_TISSUE_MORPHOLOGY,
  COALESCE(bs.PRESERVATION_METHOD, '')                                  AS PRESERVATION_METHOD,
  COALESCE(bs.SECTION_THICKNESS_VALUE, '')                              AS SECTION_THICKNESS_VALUE,
  COALESCE(bs.AGE_IN_DAYS_AT_SECTIONING, '')                            AS AGE_IN_DAYS_AT_SECTIONING,
  COALESCE(bs.SHIPPING_CONDITION_TYPE, '')                              AS SHIPPING_CONDITION_TYPE,
  COALESCE(bs.SLIDE_CHARGE_TYPE, '')                                    AS SLIDE_CHARGE_TYPE,
  COALESCE(bs.SPECIMEN_LATERALITY, '')                                  AS SPECIMEN_LATERALITY,
  COALESCE(bs.TUMOR_CLASSIFICATION, '')                                 AS TUMOR_CLASSIFICATION,
  COALESCE(bs.IS_TISSUE_SECTION, '')                                    AS IS_TISSUE_SECTION,
  COALESCE(bs.ICD_10_DISEASE_CODE, '')                                  AS ICD_10_DISEASE_CODE,
  COALESCE(bs.SITE_OF_RESECTION_OR_BIOPSY, '')                          AS SITE_OF_RESECTION_OR_BIOPSY,
  COALESCE(bs.SPECIMEN_CELLULAR_ARCHITECTURE, '')                       AS SPECIMEN_CELLULAR_ARCHITECTURE,
  COALESCE(bs.PRESERVATION_METHOD_TEMPERATURE, '')                      AS PRESERVATION_METHOD_TEMPERATURE,
  LOWER(REGEXP_EXTRACT(bs.HTAN_BIOSPECIMEN_ID, r'^(HTA[0-9]+)'))       AS atlasid,
  bs.HTAN_Center                                                        AS atlas_name,
  COALESCE(bs.PRESERVATION_MEDIUM, '')                                  AS PRESERVATION_MEDIUM,
  -- ParticipantID: resolved via the released recordset rows index
  COALESCE(rr.HTAN_PARTICIPANT_ID, '')                                  AS HTAN_PARTICIPANT_ID,
  COALESCE(bs.LONGEST_DIMENSION, '')                                    AS LONGEST_DIMENSION,
  COALESCE(bs.SHORTEST_DIMENSION, '')                                   AS SHORTEST_DIMENSION,
  COALESCE(bs.SECTION_NUMBER_IN_SEQUENCE, '')                           AS SECTION_NUMBER_IN_SEQUENCE
FROM `htan2-dcc.htan2_medallion_gold.gold_RELEASED_METADATA_TABLE_All_Records_Biospecimen` bs
LEFT JOIN (
  SELECT HTAN_ASSAYED_BIOSPECIMEN_ID, ANY_VALUE(HTAN_PARTICIPANT_ID) AS HTAN_PARTICIPANT_ID
  FROM `htan2-dcc.htan2_medallion_gold.gold_RELEASED_INDEXING_TABLE_All_Files_and_Records_ID_Provenance`
  WHERE HTAN_ASSAYED_BIOSPECIMEN_ID IS NOT NULL
  GROUP BY HTAN_ASSAYED_BIOSPECIMEN_ID
) rr ON bs.HTAN_BIOSPECIMEN_ID = rr.HTAN_ASSAYED_BIOSPECIMEN_ID;


-- ============================================================
-- VIEW: cases
-- Phase 1 table: cases
-- Combines demographics, vital status, diagnosis, therapy, and molecular test data
-- per participant into a single denormalized row.
-- ============================================================
CREATE OR REPLACE VIEW `htan2-dcc.htan2_data_portal.cases` AS
WITH
  uberon_map AS (
    SELECT
      TISSUE_OR_ORGAN_OF_ORIGIN_UBERON_CODE,
      ANY_VALUE(TISSUE_OR_ORGAN_OF_ORIGIN_UBERON_NAME) AS TISSUE_OR_ORGAN_OF_ORIGIN_UBERON_NAME
    FROM `htan2-dcc.htan2_data_mapping_tables.HTAN2_Mapping_Uberon_to_Organ`
    GROUP BY TISSUE_OR_ORGAN_OF_ORIGIN_UBERON_CODE
  ),
  vital_agg AS (
    SELECT
      HTAN_PARTICIPANT_ID,
      ANY_VALUE(VITAL_STATUS)          AS VITAL_STATUS,
      ANY_VALUE(CAUSE_OF_DEATH)        AS CAUSE_OF_DEATH,
      ANY_VALUE(CAUSE_OF_DEATH_SOURCE) AS CAUSE_OF_DEATH_SOURCE,
      ANY_VALUE(AGE_IN_DAYS_AT_DEATH)  AS AGE_IN_DAYS_AT_DEATH,
      ANY_VALUE(AGE_IN_DAYS_AT_LAST_KNOWN_SURVIVAL_STATUS) AS AGE_IN_DAYS_AT_LAST_KNOWN_SURVIVAL_STATUS
    FROM `htan2-dcc.htan2_medallion_gold.gold_RELEASED_METADATA_TABLE_All_Records_VitalStatus`
    GROUP BY HTAN_PARTICIPANT_ID
  ),
  therapy_agg AS (
    SELECT
      HTAN_PARTICIPANT_ID,
      ARRAY_AGG(DISTINCT TREATMENT_TYPE IGNORE NULLS) AS TREATMENT_TYPE
    FROM `htan2-dcc.htan2_medallion_gold.gold_RELEASED_METADATA_TABLE_All_Records_Therapy`
    GROUP BY HTAN_PARTICIPANT_ID
  ),
  molecular_agg AS (
    SELECT
      HTAN_PARTICIPANT_ID,
      ANY_VALUE(GENE_SYMBOL)               AS GENE_SYMBOL,
      ANY_VALUE(MOLECULAR_ANALYSIS_METHOD) AS MOLECULAR_ANALYSIS_METHOD,
      ANY_VALUE(TEST_RESULT)               AS TEST_RESULT
    FROM `htan2-dcc.htan2_medallion_gold.gold_RELEASED_METADATA_TABLE_All_Records_MolecularTest`
    GROUP BY HTAN_PARTICIPANT_ID
  ),
  diagnosis_name_map AS (
    SELECT
      PRIMARY_DIAGNOSIS_NCI_THESAURUS_ID,
      ANY_VALUE(PRIMARY_DIAGNOSIS_NCI_THESAURUS_NAME) AS PRIMARY_DIAGNOSIS_NCI_THESAURUS_NAME
    FROM `htan2-dcc.htan2_data_mapping_tables.HTAN2_Mapping_Diagnosis_to_Name`
    GROUP BY PRIMARY_DIAGNOSIS_NCI_THESAURUS_ID
  )
SELECT
  -- Demographics fields
  d.Component,
  d.HTAN_PARTICIPANT_ID AS HTAN_PARTICIPANT_ID,
  d.ETHNIC_GROUP,
  d.GENDER_IDENTITY,
  d.SEX,
  d.RACE,
  COALESCE(v.VITAL_STATUS, '')                                         AS VITAL_STATUS,
  d.Record_EntityId                                                   AS synapseId,
  COALESCE(v.CAUSE_OF_DEATH, '')                                        AS CAUSE_OF_DEATH,
  COALESCE(v.CAUSE_OF_DEATH_SOURCE, '')                                  AS CAUSE_OF_DEATH_SOURCE,
  COALESCE(v.AGE_IN_DAYS_AT_DEATH, '')                                         AS AGE_IN_DAYS_AT_DEATH,
  COALESCE(v.AGE_IN_DAYS_AT_LAST_KNOWN_SURVIVAL_STATUS, '')                    AS AGE_IN_DAYS_AT_LAST_KNOWN_SURVIVAL_STATUS,
  LOWER(REGEXP_EXTRACT(d.HTAN_PARTICIPANT_ID, r'^(HTA[0-9]+)'))      AS atlasid,
  d.HTAN_Center                                                       AS atlas_name,
  -- Diagnosis fields
  COALESCE(diag.AGE_IN_DAYS_AT_DIAGNOSIS, '')                         AS AGE_IN_DAYS_AT_DIAGNOSIS,
  COALESCE(diag.PRIMARY_DIAGNOSIS_NCI_THESAURUS_ID, '')               AS PRIMARY_DIAGNOSIS_NCI_THESAURUS_ID,
  COALESCE(diag.PRIMARY_DIAGNOSIS_NCI_THESAURUS_NAME, '')             AS PRIMARY_DIAGNOSIS_NCI_THESAURUS_NAME,
  COALESCE(diag.TISSUE_OR_ORGAN_OF_ORIGIN_UBERON_CODE, '')            AS TISSUE_OR_ORGAN_OF_ORIGIN_UBERON_CODE,
  COALESCE(diag.TISSUE_OR_ORGAN_OF_ORIGIN_UBERON_NAME, '')            AS TISSUE_OR_ORGAN_OF_ORIGIN_UBERON_NAME,
  COALESCE(diag.TUMOR_GRADE, '')                                      AS TUMOR_GRADE,
  COALESCE(diag.GLEASON_GRADE_GROUP, '')                              AS GLEASON_GRADE_GROUP,
  COALESCE(diag.LAST_KNOWN_DISEASE_STATUS, '')                        AS LAST_KNOWN_DISEASE_STATUS,
  COALESCE(diag.AGE_IN_DAYS_AT_LAST_KNOWN_DISEASE_STATUS, '')         AS AGE_IN_DAYS_AT_LAST_KNOWN_DISEASE_STATUS,
  COALESCE(diag.METHOD_OF_DIAGNOSIS, '')                              AS METHOD_OF_DIAGNOSIS,
  COALESCE(diag.METASTASIS_AT_DIAGNOSIS, '')                          AS METASTASIS_AT_DIAGNOSIS,
  COALESCE(diag.TUMOR_CLASSIFICATION_CATEGORY, '')                    AS TUMOR_CLASSIFICATION_CATEGORY,
  COALESCE(diag.CLINICAL_M_STAGE, '')                                 AS CLINICAL_M_STAGE,
  COALESCE(diag.CLINICAL_N_STAGE, '')                                 AS CLINICAL_N_STAGE,
  COALESCE(diag.TUMOR_STAGED, '')                                     AS TUMOR_STAGED,
  COALESCE(diag.CLINICAL_T_STAGE, '')                                 AS CLINICAL_T_STAGE,
  COALESCE(diag.AJCC_STAGING_SYSTEM_EDITION, '')                      AS AJCC_STAGING_SYSTEM_EDITION,
  COALESCE(mol.GENE_SYMBOL, '')                                        AS GENE_SYMBOL,
  COALESCE(mol.MOLECULAR_ANALYSIS_METHOD, '')                           AS MOLECULAR_ANALYSIS_METHOD,
  COALESCE(mol.TEST_RESULT, '')                                        AS TEST_RESULT,
  COALESCE(ther.TREATMENT_TYPE, CAST([] AS ARRAY<STRING>))            AS TREATMENT_TYPE
FROM `htan2-dcc.htan2_medallion_gold.gold_RELEASED_METADATA_TABLE_All_Records_Demographics` d
LEFT JOIN (
  SELECT
    d.HTAN_PARTICIPANT_ID,
    d.AGE_IN_DAYS_AT_DIAGNOSIS,
    d.PRIMARY_DIAGNOSIS_NCI_THESAURUS_ID,
    COALESCE(dnm.PRIMARY_DIAGNOSIS_NCI_THESAURUS_NAME, '') AS PRIMARY_DIAGNOSIS_NCI_THESAURUS_NAME,
    d.TISSUE_OR_ORGAN_OF_ORIGIN_UBERON_CODE,
    COALESCE(um.TISSUE_OR_ORGAN_OF_ORIGIN_UBERON_NAME, '') AS TISSUE_OR_ORGAN_OF_ORIGIN_UBERON_NAME,
    d.TUMOR_GRADE,
    d.GLEASON_GRADE_GROUP,
    d.LAST_KNOWN_DISEASE_STATUS,
    d.AGE_IN_DAYS_AT_LAST_KNOWN_DISEASE_STATUS,
    d.METHOD_OF_DIAGNOSIS,
    d.METASTASIS_AT_DIAGNOSIS,
    d.TUMOR_CLASSIFICATION_CATEGORY,
    d.CLINICAL_M_STAGE,
    d.CLINICAL_N_STAGE,
    d.TUMOR_STAGED,
    d.CLINICAL_T_STAGE,
    d.AJCC_STAGING_SYSTEM_EDITION
  FROM `htan2-dcc.htan2_medallion_gold.gold_RELEASED_METADATA_TABLE_All_Records_Diagnosis` d
  LEFT JOIN uberon_map um
    ON d.TISSUE_OR_ORGAN_OF_ORIGIN_UBERON_CODE = um.TISSUE_OR_ORGAN_OF_ORIGIN_UBERON_CODE
  LEFT JOIN diagnosis_name_map dnm
    ON d.PRIMARY_DIAGNOSIS_NCI_THESAURUS_ID = dnm.PRIMARY_DIAGNOSIS_NCI_THESAURUS_ID
) diag ON d.HTAN_PARTICIPANT_ID = diag.HTAN_PARTICIPANT_ID
LEFT JOIN vital_agg  v    ON d.HTAN_PARTICIPANT_ID = v.HTAN_PARTICIPANT_ID
LEFT JOIN therapy_agg ther ON d.HTAN_PARTICIPANT_ID = ther.HTAN_PARTICIPANT_ID
LEFT JOIN molecular_agg mol ON d.HTAN_PARTICIPANT_ID = mol.HTAN_PARTICIPANT_ID;


-- ============================================================
-- VIEW: files
-- Phase 1 table: files
-- Sources: UNION ALL of all gold_RELEASED_METADATA_TABLE_All_Files_* tables,
--          joined with provenance and clinical tables.
-- Trimmed to the file, workflow, provenance, and clinical aggregation fields
-- still used downstream.
--   biospecimenIds / demographicsIds / diagnosisIds / therapyIds come from provenance.
--   level is extracted from the Component suffix; assayName is Component without that suffix.
--   isRawSequencing is 'true' when level = 'Level1', otherwise 'false'.
-- ============================================================
CREATE OR REPLACE VIEW `htan2-dcc.htan2_data_portal.files` AS
WITH

  -- ── Step 1: UNION ALL file metadata tables ──────────────────────────────────
  all_files AS (
    SELECT
      TO_JSON_STRING(src) AS raw_file_metadata,
      src.File_EntityId,
      src.FILENAME,
      src.FILE_FORMAT,
      src.Component,
      src.HTAN_DATA_FILE_ID,
      src.HTAN_PARENT_ID,
      src.HTAN_Center,
      CAST(NULL AS STRING) AS SCRNASEQ_WORKFLOW_TYPE,
      CAST(NULL AS STRING) AS SCRNASEQ_WORKFLOW_PARAMETERS_DESCRIPTION,
      CAST(NULL AS STRING) AS WORKFLOW_VERSION,
      CAST(NULL AS STRING) AS WORKFLOW_LINK
    FROM `htan2-dcc.htan2_medallion_gold.gold_RELEASED_METADATA_TABLE_All_Files_BulkWESLevel1` src

    UNION ALL
    SELECT
      TO_JSON_STRING(src),
      src.File_EntityId, src.FILENAME, src.FILE_FORMAT, src.Component, src.HTAN_DATA_FILE_ID, src.HTAN_PARENT_ID, src.HTAN_Center,
      CAST(NULL AS STRING),
      CAST(NULL AS STRING),
      src.WORKFLOW_VERSION,
      src.WORKFLOW_LINK
    FROM `htan2-dcc.htan2_medallion_gold.gold_RELEASED_METADATA_TABLE_All_Files_BulkWESLevel2` src

    UNION ALL
    SELECT
      TO_JSON_STRING(src),
      src.File_EntityId, src.FILENAME, src.FILE_FORMAT, src.Component, src.HTAN_DATA_FILE_ID, src.HTAN_PARENT_ID, src.HTAN_Center,
      CAST(NULL AS STRING),
      CAST(NULL AS STRING),
      src.WORKFLOW_VERSION,
      src.WORKFLOW_LINK
    FROM `htan2-dcc.htan2_medallion_gold.gold_RELEASED_METADATA_TABLE_All_Files_BulkWESLevel3` src

    UNION ALL
    SELECT
      TO_JSON_STRING(src),
      src.File_EntityId, src.FILENAME, src.FILE_FORMAT, src.Component, src.HTAN_DATA_FILE_ID, src.HTAN_PARENT_ID, src.HTAN_Center,
      CAST(NULL AS STRING),
      CAST(NULL AS STRING),
      CAST(NULL AS STRING),
      CAST(NULL AS STRING)
    FROM `htan2-dcc.htan2_medallion_gold.gold_RELEASED_METADATA_TABLE_All_Files_MultiplexMicroscopyLevel2` src

    UNION ALL
    SELECT
      TO_JSON_STRING(src),
      src.File_EntityId, src.FILENAME, src.FILE_FORMAT, src.Component, src.HTAN_DATA_FILE_ID, src.HTAN_PARENT_ID, src.HTAN_Center,
      CAST(NULL AS STRING),
      CAST(NULL AS STRING),
      CAST(NULL AS STRING),
      CAST(NULL AS STRING)
    FROM `htan2-dcc.htan2_medallion_gold.gold_RELEASED_METADATA_TABLE_All_Files_MultiplexMicroscopyLevel3` src

    UNION ALL
    SELECT
      TO_JSON_STRING(src),
      src.File_EntityId, src.FILENAME, src.FILE_FORMAT, src.Component, src.HTAN_DATA_FILE_ID, src.HTAN_PARENT_ID, src.HTAN_Center,
      CAST(NULL AS STRING),
      CAST(NULL AS STRING),
      CAST(NULL AS STRING),
      CAST(NULL AS STRING)
    FROM `htan2-dcc.htan2_medallion_gold.gold_RELEASED_METADATA_TABLE_All_Files_MultiplexMicroscopyLevel4` src

    UNION ALL
    SELECT
      TO_JSON_STRING(src),
      src.File_EntityId, src.FILENAME, src.FILE_FORMAT, src.Component, src.HTAN_DATA_FILE_ID, src.HTAN_PARENT_ID, src.HTAN_Center,
      CAST(NULL AS STRING),
      CAST(NULL AS STRING),
      CAST(NULL AS STRING),
      CAST(NULL AS STRING)
    FROM `htan2-dcc.htan2_medallion_gold.gold_RELEASED_METADATA_TABLE_All_Files_scRNALevel1` src

    UNION ALL
    SELECT
      TO_JSON_STRING(src),
      src.File_EntityId, src.FILENAME, src.FILE_FORMAT, src.Component, src.HTAN_DATA_FILE_ID, src.HTAN_PARENT_ID, src.HTAN_Center,
      src.SCRNASEQ_WORKFLOW_TYPE,
      CAST(NULL AS STRING),
      src.WORKFLOW_VERSION,
      src.WORKFLOW_LINK
    FROM `htan2-dcc.htan2_medallion_gold.gold_RELEASED_METADATA_TABLE_All_Files_scRNALevel2` src

    UNION ALL
    SELECT
      TO_JSON_STRING(src),
      src.File_EntityId, src.FILENAME, src.FILE_FORMAT, src.Component, src.HTAN_DATA_FILE_ID, src.HTAN_PARENT_ID, src.HTAN_Center,
      src.SCRNASEQ_WORKFLOW_TYPE,
      src.SCRNASEQ_WORKFLOW_PARAMETERS_DESCRIPTION,
      src.WORKFLOW_VERSION,
      src.WORKFLOW_LINK
    FROM `htan2-dcc.htan2_medallion_gold.gold_RELEASED_METADATA_TABLE_All_Files_scRNALevel3and4` src

    UNION ALL
    SELECT
      TO_JSON_STRING(src),
      src.File_EntityId, src.FILENAME, src.FILE_FORMAT, src.Component, src.HTAN_DATA_FILE_ID, src.HTAN_PARENT_ID, src.HTAN_Center,
      CAST(NULL AS STRING),
      CAST(NULL AS STRING),
      CAST(NULL AS STRING),
      CAST(NULL AS STRING)
    FROM `htan2-dcc.htan2_medallion_gold.gold_RELEASED_METADATA_TABLE_All_Files_DigitalPathology` src

    UNION ALL
    SELECT
      TO_JSON_STRING(src),
      src.File_EntityId, src.FILENAME, src.FILE_FORMAT, src.Component, src.HTAN_DATA_FILE_ID, src.HTAN_PARENT_ID, src.HTAN_Center,
      CAST(NULL AS STRING),
      CAST(NULL AS STRING),
      CAST(NULL AS STRING),
      CAST(NULL AS STRING)
    FROM `htan2-dcc.htan2_medallion_gold.gold_RELEASED_METADATA_TABLE_All_Files_SpatialLevel1` src

    UNION ALL
    SELECT
      TO_JSON_STRING(src),
      src.File_EntityId, src.FILENAME, src.FILE_FORMAT, src.Component, src.HTAN_DATA_FILE_ID, src.HTAN_PARENT_ID, src.HTAN_Center,
      CAST(NULL AS STRING),
      CAST(NULL AS STRING),
      CAST(NULL AS STRING),
      CAST(NULL AS STRING)
    FROM `htan2-dcc.htan2_medallion_gold.gold_RELEASED_METADATA_TABLE_All_Files_SpatialLevel3` src

    UNION ALL
    SELECT
      TO_JSON_STRING(src),
      src.File_EntityId, src.FILENAME, src.FILE_FORMAT, src.Component, src.HTAN_DATA_FILE_ID, src.HTAN_PARENT_ID, src.HTAN_Center,
      CAST(NULL AS STRING),
      CAST(NULL AS STRING),
      CAST(NULL AS STRING),
      CAST(NULL AS STRING)
    FROM `htan2-dcc.htan2_medallion_gold.gold_RELEASED_METADATA_TABLE_All_Files_SpatialLevel4` src
  ),

  -- ── Step 2: File-to-participant mapping from provenance ──────────────────────
  file_participant_map AS (
    SELECT DISTINCT
      HTAN_DATA_FILE_ID,
      HTAN_PARTICIPANT_ID,
      HTAN_ASSAYED_BIOSPECIMEN_ID
    FROM `htan2-dcc.htan2_medallion_gold.gold_RELEASED_INDEXING_TABLE_All_Files_and_Records_ID_Provenance`
    WHERE HTAN_DATA_FILE_ID IS NOT NULL
  ),

  -- ── Step 3: Aggregate biospecimen IDs per file ───────────────────────────────
  file_biospecimens AS (
    SELECT
      HTAN_DATA_FILE_ID,
      ARRAY_AGG(DISTINCT HTAN_ASSAYED_BIOSPECIMEN_ID IGNORE NULLS) AS biospecimenIds
    FROM file_participant_map
    GROUP BY HTAN_DATA_FILE_ID
  ),

  -- ── Step 4: Aggregate participant IDs per file (for *Ids array columns) ─────
  file_participant_ids AS (
    SELECT
      HTAN_DATA_FILE_ID,
      ARRAY_AGG(DISTINCT HTAN_PARTICIPANT_ID IGNORE NULLS) AS participantIds
    FROM file_participant_map
    WHERE HTAN_PARTICIPANT_ID IS NOT NULL
    GROUP BY HTAN_DATA_FILE_ID
  ),

  diagnosis_name_map AS (
    SELECT
      PRIMARY_DIAGNOSIS_NCI_THESAURUS_ID,
      ANY_VALUE(PRIMARY_DIAGNOSIS_NCI_THESAURUS_NAME) AS PRIMARY_DIAGNOSIS_NCI_THESAURUS_NAME
    FROM `htan2-dcc.htan2_data_mapping_tables.HTAN2_Mapping_Diagnosis_to_Name`
    GROUP BY PRIMARY_DIAGNOSIS_NCI_THESAURUS_ID
  ),

  -- ── Step 5: Clinical aggregations per file via participants ─────────────────

  -- Demographics
  file_demographics AS (
    SELECT
      fpm.HTAN_DATA_FILE_ID,
      ARRAY_AGG(DISTINCT d.SEX          IGNORE NULLS) AS SEX,
      ARRAY_AGG(DISTINCT d.RACE         IGNORE NULLS) AS RACE,
      ARRAY_AGG(DISTINCT d.ETHNIC_GROUP IGNORE NULLS) AS ETHNIC_GROUP,
      ARRAY_AGG(DISTINCT fpm.HTAN_PARTICIPANT_ID IGNORE NULLS) AS demographicsIds
    FROM file_participant_map fpm
    JOIN `htan2-dcc.htan2_medallion_gold.gold_RELEASED_METADATA_TABLE_All_Records_Demographics` d
      ON fpm.HTAN_PARTICIPANT_ID = d.HTAN_PARTICIPANT_ID
    GROUP BY fpm.HTAN_DATA_FILE_ID
  ),

  -- Vital status
  file_vital AS (
    SELECT
      fpm.HTAN_DATA_FILE_ID,
      ARRAY_AGG(DISTINCT vs.VITAL_STATUS IGNORE NULLS) AS VITAL_STATUS
    FROM file_participant_map fpm
    JOIN `htan2-dcc.htan2_medallion_gold.gold_RELEASED_METADATA_TABLE_All_Records_VitalStatus` vs
      ON fpm.HTAN_PARTICIPANT_ID = vs.HTAN_PARTICIPANT_ID
    GROUP BY fpm.HTAN_DATA_FILE_ID
  ),

  -- Therapy
  file_therapy AS (
    SELECT
      fpm.HTAN_DATA_FILE_ID,
      ARRAY_AGG(DISTINCT t.TREATMENT_TYPE IGNORE NULLS) AS TREATMENT_TYPE,
      ARRAY_AGG(DISTINCT fpm.HTAN_PARTICIPANT_ID IGNORE NULLS) AS therapyIds
    FROM file_participant_map fpm
    JOIN `htan2-dcc.htan2_medallion_gold.gold_RELEASED_METADATA_TABLE_All_Records_Therapy` t
      ON fpm.HTAN_PARTICIPANT_ID = t.HTAN_PARTICIPANT_ID
    GROUP BY fpm.HTAN_DATA_FILE_ID
  ),

  -- Diagnosis
  file_diagnosis AS (
    SELECT
      fpm.HTAN_DATA_FILE_ID,
      ARRAY_AGG(DISTINCT diag.PRIMARY_DIAGNOSIS_NCI_THESAURUS_ID    IGNORE NULLS) AS PRIMARY_DIAGNOSIS_NCI_THESAURUS_ID,
      ARRAY_AGG(DISTINCT dnm.PRIMARY_DIAGNOSIS_NCI_THESAURUS_NAME   IGNORE NULLS) AS PRIMARY_DIAGNOSIS_NCI_THESAURUS_NAME,
      ARRAY_AGG(DISTINCT diag.TISSUE_OR_ORGAN_OF_ORIGIN_UBERON_CODE IGNORE NULLS) AS TISSUE_OR_ORGAN_OF_ORIGIN_UBERON_CODE,
      ARRAY_AGG(DISTINCT um.TISSUE_OR_ORGAN_OF_ORIGIN_UBERON_NAME IGNORE NULLS) AS TISSUE_OR_ORGAN_OF_ORIGIN_UBERON_NAME,
      ARRAY_AGG(DISTINCT fpm.HTAN_PARTICIPANT_ID IGNORE NULLS) AS diagnosisIds
    FROM file_participant_map fpm
    JOIN `htan2-dcc.htan2_medallion_gold.gold_RELEASED_METADATA_TABLE_All_Records_Diagnosis` diag
      ON fpm.HTAN_PARTICIPANT_ID = diag.HTAN_PARTICIPANT_ID
    LEFT JOIN diagnosis_name_map dnm
      ON diag.PRIMARY_DIAGNOSIS_NCI_THESAURUS_ID = dnm.PRIMARY_DIAGNOSIS_NCI_THESAURUS_ID
    LEFT JOIN `htan2-dcc.htan2_data_mapping_tables.HTAN2_Mapping_Uberon_to_Organ` um
      ON diag.TISSUE_OR_ORGAN_OF_ORIGIN_UBERON_CODE = um.TISSUE_OR_ORGAN_OF_ORIGIN_UBERON_CODE
    GROUP BY fpm.HTAN_DATA_FILE_ID
  )

-- ── Final SELECT ──────────────────────────────────────────────────────────────
SELECT
  f.raw_file_metadata                                                  AS raw_file_metadata,
  f.File_EntityId                                                     AS synapseId,
  LOWER(REGEXP_EXTRACT(f.HTAN_DATA_FILE_ID, r'^(HTA[0-9]+)'))        AS atlasid,
  f.HTAN_Center                                                       AS atlas_name,
  COALESCE(REGEXP_EXTRACT(f.Component, r'Level[0-9]+(?:and[0-9]+)?'), '') AS level,
  REGEXP_REPLACE(f.Component, r'Level[0-9]+(?:and[0-9]+)?$', '')     AS assayName,
  f.FILENAME                                                          AS FILENAME,
  f.FILE_FORMAT                                                       AS FILE_FORMAT,
  f.Component,
  f.HTAN_DATA_FILE_ID AS HTAN_DATA_FILE_ID,
  f.HTAN_PARENT_ID                                                    AS HTAN_PARENT_ID,
  f.HTAN_PARENT_ID                                                    AS HTAN_PARENT_DATA_FILE_ID,
  COALESCE(fb.biospecimenIds,   CAST([] AS ARRAY<STRING>))            AS biospecimenIds,
  COALESCE(fd.SEX,              CAST([] AS ARRAY<STRING>))            AS SEX,
  COALESCE(fd.ETHNIC_GROUP,    CAST([] AS ARRAY<STRING>))            AS ETHNIC_GROUP,
  COALESCE(fd.RACE,             CAST([] AS ARRAY<STRING>))            AS RACE,
  COALESCE(fv.VITAL_STATUS,     CAST([] AS ARRAY<STRING>))            AS VITAL_STATUS,
  COALESCE(ft.TREATMENT_TYPE,   CAST([] AS ARRAY<STRING>))            AS TREATMENT_TYPE,
  COALESCE(fdia.PRIMARY_DIAGNOSIS_NCI_THESAURUS_ID, CAST([] AS ARRAY<STRING>)) AS PRIMARY_DIAGNOSIS_NCI_THESAURUS_ID,
  COALESCE(fdia.PRIMARY_DIAGNOSIS_NCI_THESAURUS_NAME, CAST([] AS ARRAY<STRING>)) AS PRIMARY_DIAGNOSIS_NCI_THESAURUS_NAME,
  COALESCE(fdia.TISSUE_OR_ORGAN_OF_ORIGIN_UBERON_CODE, CAST([] AS ARRAY<STRING>)) AS TISSUE_OR_ORGAN_OF_ORIGIN_UBERON_CODE,
  COALESCE(fdia.TISSUE_OR_ORGAN_OF_ORIGIN_UBERON_NAME, CAST([] AS ARRAY<STRING>)) AS TISSUE_OR_ORGAN_OF_ORIGIN_UBERON_NAME,
  COALESCE(f.SCRNASEQ_WORKFLOW_TYPE, '')                              AS SCRNASEQ_WORKFLOW_TYPE,
  COALESCE(f.SCRNASEQ_WORKFLOW_PARAMETERS_DESCRIPTION, '')            AS SCRNASEQ_WORKFLOW_PARAMETERS_DESCRIPTION,
  COALESCE(f.WORKFLOW_VERSION, '')                                    AS WORKFLOW_VERSION,
  COALESCE(f.WORKFLOW_LINK, '')                                       AS WORKFLOW_LINK,
  COALESCE(fdia.diagnosisIds,   CAST([] AS ARRAY<STRING>))            AS diagnosisIds,
  COALESCE(fd.demographicsIds,  CAST([] AS ARRAY<STRING>))            AS demographicsIds,
  COALESCE(ft.therapyIds,       CAST([] AS ARRAY<STRING>))            AS therapyIds,
  IF(REGEXP_CONTAINS(f.Component, r'Level1$'), 'true', 'false')       AS isRawSequencing
FROM all_files f
LEFT JOIN file_biospecimens  fb   ON f.HTAN_DATA_FILE_ID = fb.HTAN_DATA_FILE_ID
LEFT JOIN file_demographics  fd   ON f.HTAN_DATA_FILE_ID = fd.HTAN_DATA_FILE_ID
LEFT JOIN file_vital         fv   ON f.HTAN_DATA_FILE_ID = fv.HTAN_DATA_FILE_ID
LEFT JOIN file_therapy       ft   ON f.HTAN_DATA_FILE_ID = ft.HTAN_DATA_FILE_ID
LEFT JOIN file_diagnosis     fdia ON f.HTAN_DATA_FILE_ID = fdia.HTAN_DATA_FILE_ID;


-- ============================================================
-- VIEW: publication_manifest
-- Phase 1 table: publication_manifest
-- Phase 2 does not expose publication data in the gold_RELEASED_* tables.
-- This view still returns an empty result set with the Phase 1 schema
-- as a placeholder until publication data becomes available.
-- ============================================================
CREATE OR REPLACE VIEW `htan2-dcc.htan2_data_portal.publication_manifest` AS
SELECT
  CAST(NULL AS STRING) AS Authors,
  CAST(NULL AS STRING) AS CitedInNumber,
  CAST(NULL AS STRING) AS Component,
  CAST(NULL AS STRING) AS CorrespondingAuthor,
  CAST(NULL AS STRING) AS CorrespondingAuthorORCID,
  CAST(NULL AS STRING) AS DataType,
  CAST(NULL AS STRING) AS EutilsAuthors,
  CAST(NULL AS STRING) AS EutilsDOI,
  CAST(NULL AS STRING) AS EutilsDate,
  CAST(NULL AS STRING) AS EutilsJournal,
  CAST(NULL AS STRING) AS EutilsSortDate,
  CAST(NULL AS STRING) AS EutilsTitle,
  CAST(NULL AS STRING) AS HTANCenterID,
  CAST(NULL AS STRING) AS HTANGrantID,
  CAST(NULL AS STRING) AS License,
  CAST(NULL AS STRING) AS LocationofPublication,
  CAST(NULL AS STRING) AS PublicationAbstract,
  CAST(NULL AS STRING) AS PublicationContentType,
  CAST(NULL AS STRING) AS PublicationcontainsHTANID,
  CAST(NULL AS STRING) AS PublicationAssociatedHTANParentDataFileID,
  CAST(NULL AS STRING) AS SupportingLink,
  CAST(NULL AS STRING) AS SupportingLinkDescription,
  CAST(NULL AS STRING) AS Title,
  CAST(NULL AS STRING) AS Tool,
  CAST(NULL AS STRING) AS UCSCCellBrowserLink,
  CAST(NULL AS STRING) AS YearofPublication,
  CAST(NULL AS STRING) AS atlasid,
  CAST(NULL AS STRING) AS atlas_name,
  CAST(NULL AS STRING) AS level,
  CAST(NULL AS STRING) AS assayName,
  CAST(NULL AS STRING) AS AtlasMeta,
  CAST(NULL AS STRING) AS PublicationAssociatedParentDataFileID,
  CAST(NULL AS STRING) AS GrantID,
  CAST(NULL AS STRING) AS CenterID,
  CAST(NULL AS STRING) AS PublicationContainsID,
  CAST(NULL AS STRING) AS publicationId,
  CAST(NULL AS STRING) AS PMID,
  CAST([] AS ARRAY<STRING>) AS associatedFiles
FROM (SELECT 1 AS _dummy) WHERE FALSE;
