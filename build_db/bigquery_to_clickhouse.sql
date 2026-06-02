-- BigQuery SQL: Transform Phase 2 (BigQuery) data to Phase 1 (ClickHouse) table structure
--
-- Usage:
--   Target views are created in: htan2-dcc.htan2_data_portal
--   Execute each CREATE OR REPLACE VIEW statement in BigQuery to create Phase 1-equivalent views.
--   All source tables are the `gold_RELEASED_*` tables in: htan2-dcc.htan2_medallion_gold
--
-- Phase 1 tables produced:
--   phase1_atlases            -> atlases
--   phase1_demographics       -> demographics
--   phase1_diagnosis          -> diagnosis
--   phase1_specimen           -> specimen
--   phase1_cases              -> cases
--   phase1_files              -> files
--   phase1_publication_manifest -> publication_manifest (placeholder – no equivalent in Phase 2)
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
-- VIEW: phase1_atlases
-- Phase 1 table: atlases
-- Derived from demographics and biospecimen counts per center.
-- ============================================================
CREATE OR REPLACE VIEW `htan2-dcc.htan2_data_portal.phase1_atlases` AS
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
  '{}' AS AtlasMeta,
  CAST(COALESCE(bc.num_biospecimens, 0) AS STRING) AS num_biospecimens,
  CAST(COALESCE(pc.num_cases, 0) AS STRING) AS num_cases
FROM centers c
LEFT JOIN participant_counts pc USING (htan_id)
LEFT JOIN biospecimen_counts bc USING (htan_id);


-- ============================================================
-- VIEW: phase1_demographics
-- Phase 1 table: demographics
-- Source: Demographics + VitalStatus records.
-- Column mapping notes:
--   Gender   <- SEX  (biological sex; Phase 2 renamed the field)
--   Ethnicity <- ETHNIC_GROUP
--   Race     <- RACE
--   VitalStatus / CauseofDeath / DaystoDeath <- VitalStatus table (LEFT JOIN)
--   synapseId <- Record_EntityId
-- Fields with no Phase 2 equivalent are set to ''.
-- ============================================================
CREATE OR REPLACE VIEW `htan2-dcc.htan2_data_portal.phase1_demographics` AS
SELECT
  d.Component,
  d.HTAN_PARTICIPANT_ID                                            AS HTANParticipantID,
  d.ETHNIC_GROUP                                                   AS Ethnicity,
  d.SEX                                                            AS Gender,
  d.RACE                                                           AS Race,
  COALESCE(vs.VITAL_STATUS, '')                                    AS VitalStatus,
  ''                                                               AS DaystoBirth,
  ''                                                               AS CountryofResidence,
  ''                                                               AS AgeIsObfuscated,
  ''                                                               AS YearOfBirth,
  ''                                                               AS OccupationDurationYears,
  ''                                                               AS PrematureAtBirth,
  ''                                                               AS WeeksGestationatBirth,
  d.Record_EntityId                                                AS synapseId,
  COALESCE(vs.CAUSE_OF_DEATH, '')                                  AS CauseofDeath,
  COALESCE(vs.CAUSE_OF_DEATH_SOURCE, '')                           AS CauseofDeathSource,
  COALESCE(vs.AGE_IN_DAYS_AT_DEATH, '')                            AS DaystoDeath,
  ''                                                               AS YearofDeath,
  LOWER(REGEXP_EXTRACT(d.HTAN_PARTICIPANT_ID, r'^(HTA[0-9]+)'))   AS atlasid,
  d.HTAN_Center                                                    AS atlas_name,
  ''                                                               AS level,
  ''                                                               AS assayName,
  ''                                                               AS AtlasMeta,
  d.HTAN_PARTICIPANT_ID                                            AS ParticipantID,
  CAST([] AS ARRAY<STRING>)                                        AS publicationIds,
  ''                                                               AS AFR,
  ''                                                               AS AMR,
  ''                                                               AS EAS,
  ''                                                               AS EUR,
  ''                                                               AS SAS,
  ''                                                               AS EducationLevel,
  ''                                                               AS MedicallyUnderservedArea,
  ''                                                               AS RuralvsUrban
FROM `htan2-dcc.htan2_medallion_gold.gold_RELEASED_METADATA_TABLE_All_Records_Demographics` d
LEFT JOIN (
  SELECT HTAN_PARTICIPANT_ID,
         ANY_VALUE(VITAL_STATUS)         AS VITAL_STATUS,
         ANY_VALUE(CAUSE_OF_DEATH)       AS CAUSE_OF_DEATH,
         ANY_VALUE(CAUSE_OF_DEATH_SOURCE) AS CAUSE_OF_DEATH_SOURCE,
         ANY_VALUE(AGE_IN_DAYS_AT_DEATH)  AS AGE_IN_DAYS_AT_DEATH
  FROM `htan2-dcc.htan2_medallion_gold.gold_RELEASED_METADATA_TABLE_All_Records_VitalStatus`
  GROUP BY HTAN_PARTICIPANT_ID
) vs ON d.HTAN_PARTICIPANT_ID = vs.HTAN_PARTICIPANT_ID;


-- ============================================================
-- VIEW: phase1_diagnosis
-- Phase 1 table: diagnosis
-- Source: Diagnosis + Therapy + MolecularTest records.
-- Column mapping notes:
--   AgeatDiagnosis              <- AGE_IN_DAYS_AT_DIAGNOSIS
--   PrimaryDiagnosis            <- PRIMARY_DIAGNOSIS_NCI_THESAURUS_ID
--   TissueorOrganofOrigin       <- TISSUE_OR_ORGAN_OF_ORIGIN_UBERON_CODE
--   AJCCClinicalM/N/T           <- CLINICAL_M/N/T_STAGE
--   AJCCStagingSystemEdition    <- AJCC_STAGING_SYSTEM_EDITION
--   ClassificationofTumor       <- TUMOR_CLASSIFICATION_CATEGORY
--   DaystoLastKnownDiseaseStatus <- AGE_IN_DAYS_AT_LAST_KNOWN_DISEASE_STATUS
--   TreatmentType               <- TREATMENT_TYPE (via Therapy join, ARRAY_AGG)
--   GeneSymbol/MolecularAnalysisMethod/TestResult <- MolecularTest join
--   Fields with no Phase 2 equivalent are set to ''.
-- ============================================================
CREATE OR REPLACE VIEW `htan2-dcc.htan2_data_portal.phase1_diagnosis` AS
WITH
  therapy_agg AS (
    SELECT
      HTAN_PARTICIPANT_ID,
      ARRAY_AGG(DISTINCT TREATMENT_TYPE IGNORE NULLS) AS TreatmentType
    FROM `htan2-dcc.htan2_medallion_gold.gold_RELEASED_METADATA_TABLE_All_Records_Therapy`
    GROUP BY HTAN_PARTICIPANT_ID
  ),
  molecular_agg AS (
    SELECT
      HTAN_PARTICIPANT_ID,
      ANY_VALUE(GENE_SYMBOL)             AS GeneSymbol,
      ANY_VALUE(MOLECULAR_ANALYSIS_METHOD) AS MolecularAnalysisMethod,
      ANY_VALUE(TEST_RESULT)             AS TestResult
    FROM `htan2-dcc.htan2_medallion_gold.gold_RELEASED_METADATA_TABLE_All_Records_MolecularTest`
    GROUP BY HTAN_PARTICIPANT_ID
  )
SELECT
  diag.Component,
  diag.HTAN_PARTICIPANT_ID                                              AS HTANParticipantID,
  COALESCE(diag.AGE_IN_DAYS_AT_DIAGNOSIS, '')                          AS AgeatDiagnosis,
  ''                                                                    AS YearofDiagnosis,
  COALESCE(diag.PRIMARY_DIAGNOSIS_NCI_THESAURUS_ID, '')                AS PrimaryDiagnosis,
  ''                                                                    AS PrecancerousConditionType,
  ''                                                                    AS SiteofResectionorBiopsy,
  COALESCE(diag.TISSUE_OR_ORGAN_OF_ORIGIN_UBERON_CODE, '')             AS TissueorOrganofOrigin,
  ''                                                                    AS Morphology,
  COALESCE(diag.TUMOR_GRADE, '')                                       AS TumorGrade,
  ''                                                                    AS ProgressionorRecurrence,
  COALESCE(diag.LAST_KNOWN_DISEASE_STATUS, '')                         AS LastKnownDiseaseStatus,
  ''                                                                    AS DaystoLastFollowup,
  COALESCE(diag.AGE_IN_DAYS_AT_LAST_KNOWN_DISEASE_STATUS, '')          AS DaystoLastKnownDiseaseStatus,
  COALESCE(diag.METHOD_OF_DIAGNOSIS, '')                               AS MethodofDiagnosis,
  ''                                                                    AS PriorMalignancy,
  ''                                                                    AS PriorTreatment,
  COALESCE(diag.METASTASIS_AT_DIAGNOSIS, '')                           AS MetastasisatDiagnosis,
  ''                                                                    AS MetastasisatDiagnosisSite,
  ''                                                                    AS FirstSymptomPriortoDiagnosis,
  ''                                                                    AS DaystoDiagnosis,
  ''                                                                    AS PercentTumorInvasion,
  ''                                                                    AS ResidualDisease,
  ''                                                                    AS SynchronousMalignancy,
  ''                                                                    AS TumorConfinedtoOrganofOrigin,
  ''                                                                    AS TumorFocality,
  ''                                                                    AS TumorLargestDimensionDiameter,
  ''                                                                    AS BreslowThickness,
  ''                                                                    AS VascularInvasionPresent,
  ''                                                                    AS VascularInvasionType,
  ''                                                                    AS AnaplasiaPresent,
  ''                                                                    AS AnaplasiaPresentType,
  ''                                                                    AS Laterality,
  ''                                                                    AS PerineuralInvasionPresent,
  ''                                                                    AS LymphaticInvasionPresent,
  ''                                                                    AS LymphNodesPositive,
  ''                                                                    AS LymphNodesTested,
  ''                                                                    AS PeritonealFluidCytologicalStatus,
  COALESCE(diag.TUMOR_CLASSIFICATION_CATEGORY, '')                     AS ClassificationofTumor,
  ''                                                                    AS BestOverallResponse,
  ''                                                                    AS MitoticCount,
  COALESCE(diag.CLINICAL_M_STAGE, '')                                  AS AJCCClinicalM,
  COALESCE(diag.CLINICAL_N_STAGE, '')                                  AS AJCCClinicalN,
  COALESCE(diag.TUMOR_STAGED, '')                                      AS AJCCClinicalStage,
  COALESCE(diag.CLINICAL_T_STAGE, '')                                  AS AJCCClinicalT,
  ''                                                                    AS AJCCPathologicM,
  ''                                                                    AS AJCCPathologicN,
  ''                                                                    AS AJCCPathologicStage,
  ''                                                                    AS AJCCPathologicT,
  COALESCE(diag.AJCC_STAGING_SYSTEM_EDITION, '')                       AS AJCCStagingSystemEdition,
  ''                                                                    AS CogNeuroblastomaRiskGroup,
  ''                                                                    AS CogRhabdomyosarcomaRiskGroup,
  ''                                                                    AS GreatestTumorDimension,
  ''                                                                    AS IGCCCGStage,
  ''                                                                    AS INPCGrade,
  ''                                                                    AS INPCHistologicGroup,
  ''                                                                    AS INRGStage,
  ''                                                                    AS INSSStage,
  ''                                                                    AS IRSGroup,
  ''                                                                    AS IRSStage,
  ''                                                                    AS ISSStage,
  ''                                                                    AS LymphNodeInvolvedSite,
  ''                                                                    AS MarginDistance,
  ''                                                                    AS MicropapillaryFeatures,
  ''                                                                    AS PregnantatDiagnosis,
  ''                                                                    AS SupratentorialLocalization,
  ''                                                                    AS TumorDepth,
  ''                                                                    AS WHOCNSGrade,
  diag.Record_EntityId                                                  AS synapseId,
  ''                                                                    AS DaystoProgression,
  ''                                                                    AS DaystoProgressionFree,
  ''                                                                    AS ProgressionorRecurrenceType,
  LOWER(REGEXP_EXTRACT(diag.HTAN_PARTICIPANT_ID, r'^(HTA[0-9]+)'))    AS atlasid,
  diag.HTAN_Center                                                      AS atlas_name,
  ''                                                                    AS level,
  ''                                                                    AS assayName,
  ''                                                                    AS AtlasMeta,
  diag.HTAN_PARTICIPANT_ID                                              AS ParticipantID,
  CAST([] AS ARRAY<STRING>)                                             AS publicationIds,
  ''                                                                    AS DaystoRecurrence,
  COALESCE(mol.GeneSymbol, '')                                          AS GeneSymbol,
  COALESCE(mol.MolecularAnalysisMethod, '')                             AS MolecularAnalysisMethod,
  COALESCE(mol.TestResult, '')                                          AS TestResult,
  COALESCE(ther.TreatmentType, CAST([] AS ARRAY<STRING>))              AS TreatmentType,
  CAST([] AS ARRAY<STRING>)                                             AS organType
FROM `htan2-dcc.htan2_medallion_gold.gold_RELEASED_METADATA_TABLE_All_Records_Diagnosis` diag
LEFT JOIN therapy_agg ther
  ON diag.HTAN_PARTICIPANT_ID = ther.HTAN_PARTICIPANT_ID
LEFT JOIN molecular_agg mol
  ON diag.HTAN_PARTICIPANT_ID = mol.HTAN_PARTICIPANT_ID;


-- ============================================================
-- VIEW: phase1_specimen
-- Phase 1 table: specimen
-- Source: Biospecimen records + Released RecordsetRows (for ParticipantID).
-- Column mapping notes:
--   HTANBiospecimenID  <- HTAN_BIOSPECIMEN_ID
--   HTANParentID       <- HTAN_PARENT_ID
--   TimepointLabel     <- TIMEPOINT
--   CollectionDaysfromIndex <- AGE_IN_DAYS_AT_SPECIMEN_COLLECTION
--   SectioningDaysfromIndex <- AGE_IN_DAYS_AT_SECTIONING
--   ProcessingDaysfromIndex <- AGE_IN_DAYS_AT_SPECIMEN_PROCESSING
--   HistologicMorphologyCode <- ICD_O_3_TISSUE_MORPHOLOGY
--   TumorTissueType    <- TUMOR_CLASSIFICATION
--   BiospecimenDimension1 <- LONGEST_DIMENSION
--   BiospecimenDimension2 <- SHORTEST_DIMENSION
--   FixationDuration   <- FIXATION_DURATION_IN_MINUTES
--   SourceHTANBiospecimenID <- HTAN_PARENT_ID when it is a biospecimen (contains '_')
--     Uses regex r'^HTA[0-9]+_[0-9]+_' to detect biospecimen parents vs. participant parents.
--   StorageMethod      <- PRESERVATION_MEDIUM (preferred) falling back to PRESERVATION_METHOD
--     PRESERVATION_MEDIUM is the primary Phase 2 storage-medium field; PRESERVATION_METHOD
--     is the broader preservation category used when the medium field is absent.
--   Fields with no Phase 2 equivalent are set to ''.
-- ============================================================
CREATE OR REPLACE VIEW `htan2-dcc.htan2_data_portal.phase1_specimen` AS
SELECT
  bs.Component,
  bs.HTAN_BIOSPECIMEN_ID                                                AS HTANBiospecimenID,
  -- SourceHTANBiospecimenID: the parent when the parent is another biospecimen
  IF(
    REGEXP_CONTAINS(COALESCE(bs.HTAN_PARENT_ID, ''), r'^HTA[0-9]+_[0-9]+_'),
    bs.HTAN_PARENT_ID,
    ''
  )                                                                     AS SourceHTANBiospecimenID,
  bs.HTAN_PARENT_ID                                                     AS HTANParentID,
  COALESCE(bs.TIMEPOINT, '')                                            AS TimepointLabel,
  COALESCE(bs.AGE_IN_DAYS_AT_SPECIMEN_COLLECTION, '')                   AS CollectionDaysfromIndex,
  COALESCE(bs.ADJACENT_BIOSPECIMEN_IDS, '')                             AS AdjacentBiospecimenIDs,
  COALESCE(bs.BIOSPECIMEN_TYPE, '')                                      AS BiospecimenType,
  COALESCE(bs.ACQUISITION_METHOD_TYPE, '')                              AS AcquisitionMethodType,
  ''                                                                    AS FixativeType,
  COALESCE(bs.PRESERVATION_MEDIUM, bs.PRESERVATION_METHOD, '')         AS StorageMethod,
  COALESCE(bs.AGE_IN_DAYS_AT_SPECIMEN_PROCESSING, '')                   AS ProcessingDaysfromIndex,
  ''                                                                    AS ProtocolLink,
  COALESCE(bs.SITE_DATA_SOURCE, '')                                     AS SiteDataSource,
  ''                                                                    AS CollectionMedia,
  ''                                                                    AS MountingMedium,
  COALESCE(bs.PROCESSING_LOCATION, '')                                  AS ProcessingLocation,
  ''                                                                    AS HistologyAssessmentBy,
  ''                                                                    AS HistologyAssessmentMedium,
  ''                                                                    AS PreinvasiveMorphology,
  ''                                                                    AS TumorInfiltratingLymphocytes,
  COALESCE(bs.DEGREE_OF_DYSPLASIA, '')                                  AS DegreeofDysplasia,
  ''                                                                    AS DysplasiaFraction,
  ''                                                                    AS NumberProliferatingCells,
  ''                                                                    AS PercentEosinophilInfiltration,
  ''                                                                    AS PercentGranulocyteInfiltration,
  ''                                                                    AS PercentInflamInfiltration,
  ''                                                                    AS PercentLymphocyteInfiltration,
  ''                                                                    AS PercentMonocyteInfiltration,
  COALESCE(bs.PERCENT_NECROSIS, '')                                     AS PercentNecrosis,
  ''                                                                    AS PercentNeutrophilInfiltration,
  COALESCE(bs.PERCENT_NORMAL_CELLS, '')                                 AS PercentNormalCells,
  ''                                                                    AS PercentStromalCells,
  COALESCE(bs.PERCENT_TUMOR_CELLS, '')                                  AS PercentTumorCells,
  COALESCE(bs.PERCENT_TUMOR_NUCLEI, '')                                 AS PercentTumorNuclei,
  ''                                                                    AS FiducialMarker,
  COALESCE(bs.SLICING_METHOD, '')                                       AS SlicingMethod,
  ''                                                                    AS LysisBuffer,
  COALESCE(bs.METHOD_OF_NUCLEIC_ACID_ISOLATION, '')                     AS MethodofNucleicAcidIsolation,
  bs.Record_EntityId                                                    AS synapseId,
  COALESCE(bs.ACQUISITION_METHOD_OTHER_SPECIFY, '')                     AS AcquisitionMethodOtherSpecify,
  COALESCE(bs.ANALYTE_TYPE, '')                                         AS AnalyteType,
  COALESCE(bs.FIXATION_DURATION_IN_MINUTES, '')                         AS FixationDuration,
  COALESCE(bs.ICD_O_3_TISSUE_MORPHOLOGY, '')                            AS HistologicMorphologyCode,
  ''                                                                    AS IschemicTemperature,
  ''                                                                    AS IschemicTime,
  ''                                                                    AS PortionWeight,
  COALESCE(bs.PRESERVATION_METHOD, '')                                  AS PreservationMethod,
  COALESCE(bs.SECTION_THICKNESS_VALUE, '')                              AS SectionThicknessValue,
  COALESCE(bs.AGE_IN_DAYS_AT_SECTIONING, '')                            AS SectioningDaysfromIndex,
  COALESCE(bs.SHIPPING_CONDITION_TYPE, '')                              AS ShippingConditionType,
  COALESCE(bs.SLIDE_CHARGE_TYPE, '')                                    AS SlideChargeType,
  COALESCE(bs.SPECIMEN_LATERALITY, '')                                  AS SpecimenLaterality,
  ''                                                                    AS TotalVolume,
  COALESCE(bs.TUMOR_CLASSIFICATION, '')                                 AS TumorTissueType,
  LOWER(REGEXP_EXTRACT(bs.HTAN_BIOSPECIMEN_ID, r'^(HTA[0-9]+)'))       AS atlasid,
  bs.HTAN_Center                                                        AS atlas_name,
  ''                                                                    AS level,
  ''                                                                    AS assayName,
  ''                                                                    AS AtlasMeta,
  bs.HTAN_PARENT_ID                                                     AS ParentID,
  bs.HTAN_BIOSPECIMEN_ID                                                AS BiospecimenID,
  CAST([] AS ARRAY<STRING>)                                             AS publicationIds,
  -- ParticipantID: resolved via the released recordset rows index
  COALESCE(rr.HTAN_PARTICIPANT_ID, '')                                  AS ParticipantID,
  COALESCE(bs.LONGEST_DIMENSION, '')                                    AS BiospecimenDimension1,
  COALESCE(bs.SHORTEST_DIMENSION, '')                                   AS BiospecimenDimension2,
  ''                                                                    AS BiospecimenDimension3,
  ''                                                                    AS DimensionsUnit,
  COALESCE(bs.SECTION_NUMBER_IN_SEQUENCE, '')                           AS SectionNumberinSequence,
  ''                                                                    AS TotalVolumeUnit,
  ''                                                                    AS TopographyCode,
  ''                                                                    AS AdditionalTopography
FROM `htan2-dcc.htan2_medallion_gold.gold_RELEASED_METADATA_TABLE_All_Records_Biospecimen` bs
LEFT JOIN (
  SELECT Record_EntityId, ANY_VALUE(HTAN_PARTICIPANT_ID) AS HTAN_PARTICIPANT_ID
  FROM `htan2-dcc.htan2_medallion_gold.gold_RELEASED_INDEXING_TABLE_Released_RecordsetRows`
  GROUP BY Record_EntityId
) rr ON bs.Record_EntityId = rr.Record_EntityId;


-- ============================================================
-- VIEW: phase1_cases
-- Phase 1 table: cases
-- Combines demographics, vital status, diagnosis, therapy, and molecular test data
-- per participant into a single denormalized row.
-- ============================================================
CREATE OR REPLACE VIEW `htan2-dcc.htan2_data_portal.phase1_cases` AS
WITH
  vital_agg AS (
    SELECT
      HTAN_PARTICIPANT_ID,
      ANY_VALUE(VITAL_STATUS)          AS VitalStatus,
      ANY_VALUE(CAUSE_OF_DEATH)        AS CauseofDeath,
      ANY_VALUE(CAUSE_OF_DEATH_SOURCE) AS CauseofDeathSource,
      ANY_VALUE(AGE_IN_DAYS_AT_DEATH)  AS DaystoDeath
    FROM `htan2-dcc.htan2_medallion_gold.gold_RELEASED_METADATA_TABLE_All_Records_VitalStatus`
    GROUP BY HTAN_PARTICIPANT_ID
  ),
  therapy_agg AS (
    SELECT
      HTAN_PARTICIPANT_ID,
      ARRAY_AGG(DISTINCT TREATMENT_TYPE IGNORE NULLS) AS TreatmentType
    FROM `htan2-dcc.htan2_medallion_gold.gold_RELEASED_METADATA_TABLE_All_Records_Therapy`
    GROUP BY HTAN_PARTICIPANT_ID
  ),
  molecular_agg AS (
    SELECT
      HTAN_PARTICIPANT_ID,
      ANY_VALUE(GENE_SYMBOL)               AS GeneSymbol,
      ANY_VALUE(MOLECULAR_ANALYSIS_METHOD) AS MolecularAnalysisMethod,
      ANY_VALUE(TEST_RESULT)               AS TestResult
    FROM `htan2-dcc.htan2_medallion_gold.gold_RELEASED_METADATA_TABLE_All_Records_MolecularTest`
    GROUP BY HTAN_PARTICIPANT_ID
  )
SELECT
  -- Demographics fields
  d.Component,
  d.HTAN_PARTICIPANT_ID                                               AS HTANParticipantID,
  d.ETHNIC_GROUP                                                      AS Ethnicity,
  d.SEX                                                               AS Gender,
  d.RACE                                                              AS Race,
  COALESCE(v.VitalStatus, '')                                         AS VitalStatus,
  ''                                                                  AS DaystoBirth,
  ''                                                                  AS CountryofResidence,
  ''                                                                  AS AgeIsObfuscated,
  ''                                                                  AS YearOfBirth,
  ''                                                                  AS OccupationDurationYears,
  ''                                                                  AS PrematureAtBirth,
  ''                                                                  AS WeeksGestationatBirth,
  d.Record_EntityId                                                   AS synapseId,
  COALESCE(v.CauseofDeath, '')                                        AS CauseofDeath,
  COALESCE(v.CauseofDeathSource, '')                                  AS CauseofDeathSource,
  COALESCE(v.DaystoDeath, '')                                         AS DaystoDeath,
  ''                                                                  AS YearofDeath,
  LOWER(REGEXP_EXTRACT(d.HTAN_PARTICIPANT_ID, r'^(HTA[0-9]+)'))      AS atlasid,
  d.HTAN_Center                                                       AS atlas_name,
  ''                                                                  AS level,
  ''                                                                  AS assayName,
  ''                                                                  AS AtlasMeta,
  d.HTAN_PARTICIPANT_ID                                               AS ParticipantID,
  CAST([] AS ARRAY<STRING>)                                           AS publicationIds,
  ''                                                                  AS AFR,
  ''                                                                  AS AMR,
  ''                                                                  AS EAS,
  ''                                                                  AS EUR,
  ''                                                                  AS SAS,
  ''                                                                  AS EducationLevel,
  ''                                                                  AS MedicallyUnderservedArea,
  ''                                                                  AS RuralvsUrban,
  -- Diagnosis fields
  COALESCE(diag.AGE_IN_DAYS_AT_DIAGNOSIS, '')                         AS AgeatDiagnosis,
  ''                                                                  AS YearofDiagnosis,
  COALESCE(diag.PRIMARY_DIAGNOSIS_NCI_THESAURUS_ID, '')               AS PrimaryDiagnosis,
  ''                                                                  AS PrecancerousConditionType,
  ''                                                                  AS SiteofResectionorBiopsy,
  COALESCE(diag.TISSUE_OR_ORGAN_OF_ORIGIN_UBERON_CODE, '')            AS TissueorOrganofOrigin,
  ''                                                                  AS Morphology,
  COALESCE(diag.TUMOR_GRADE, '')                                      AS TumorGrade,
  ''                                                                  AS ProgressionorRecurrence,
  COALESCE(diag.LAST_KNOWN_DISEASE_STATUS, '')                        AS LastKnownDiseaseStatus,
  ''                                                                  AS DaystoLastFollowup,
  COALESCE(diag.AGE_IN_DAYS_AT_LAST_KNOWN_DISEASE_STATUS, '')         AS DaystoLastKnownDiseaseStatus,
  COALESCE(diag.METHOD_OF_DIAGNOSIS, '')                              AS MethodofDiagnosis,
  ''                                                                  AS PriorMalignancy,
  ''                                                                  AS PriorTreatment,
  COALESCE(diag.METASTASIS_AT_DIAGNOSIS, '')                          AS MetastasisatDiagnosis,
  ''                                                                  AS MetastasisatDiagnosisSite,
  ''                                                                  AS FirstSymptomPriortoDiagnosis,
  ''                                                                  AS DaystoDiagnosis,
  ''                                                                  AS PercentTumorInvasion,
  ''                                                                  AS ResidualDisease,
  ''                                                                  AS SynchronousMalignancy,
  ''                                                                  AS TumorConfinedtoOrganofOrigin,
  ''                                                                  AS TumorFocality,
  ''                                                                  AS TumorLargestDimensionDiameter,
  ''                                                                  AS BreslowThickness,
  ''                                                                  AS VascularInvasionPresent,
  ''                                                                  AS VascularInvasionType,
  ''                                                                  AS AnaplasiaPresent,
  ''                                                                  AS AnaplasiaPresentType,
  ''                                                                  AS Laterality,
  ''                                                                  AS PerineuralInvasionPresent,
  ''                                                                  AS LymphaticInvasionPresent,
  ''                                                                  AS LymphNodesPositive,
  ''                                                                  AS LymphNodesTested,
  ''                                                                  AS PeritonealFluidCytologicalStatus,
  COALESCE(diag.TUMOR_CLASSIFICATION_CATEGORY, '')                    AS ClassificationofTumor,
  ''                                                                  AS BestOverallResponse,
  ''                                                                  AS MitoticCount,
  COALESCE(diag.CLINICAL_M_STAGE, '')                                 AS AJCCClinicalM,
  COALESCE(diag.CLINICAL_N_STAGE, '')                                 AS AJCCClinicalN,
  COALESCE(diag.TUMOR_STAGED, '')                                     AS AJCCClinicalStage,
  COALESCE(diag.CLINICAL_T_STAGE, '')                                 AS AJCCClinicalT,
  ''                                                                  AS AJCCPathologicM,
  ''                                                                  AS AJCCPathologicN,
  ''                                                                  AS AJCCPathologicStage,
  ''                                                                  AS AJCCPathologicT,
  COALESCE(diag.AJCC_STAGING_SYSTEM_EDITION, '')                      AS AJCCStagingSystemEdition,
  ''                                                                  AS CogNeuroblastomaRiskGroup,
  ''                                                                  AS CogRhabdomyosarcomaRiskGroup,
  ''                                                                  AS GreatestTumorDimension,
  ''                                                                  AS IGCCCGStage,
  ''                                                                  AS INPCGrade,
  ''                                                                  AS INPCHistologicGroup,
  ''                                                                  AS INRGStage,
  ''                                                                  AS INSSStage,
  ''                                                                  AS IRSGroup,
  ''                                                                  AS IRSStage,
  ''                                                                  AS ISSStage,
  ''                                                                  AS LymphNodeInvolvedSite,
  ''                                                                  AS MarginDistance,
  ''                                                                  AS MicropapillaryFeatures,
  ''                                                                  AS PregnantatDiagnosis,
  ''                                                                  AS SupratentorialLocalization,
  ''                                                                  AS TumorDepth,
  ''                                                                  AS WHOCNSGrade,
  ''                                                                  AS DaystoProgression,
  ''                                                                  AS DaystoProgressionFree,
  ''                                                                  AS ProgressionorRecurrenceType,
  ''                                                                  AS DaystoRecurrence,
  COALESCE(mol.GeneSymbol, '')                                        AS GeneSymbol,
  COALESCE(mol.MolecularAnalysisMethod, '')                           AS MolecularAnalysisMethod,
  COALESCE(mol.TestResult, '')                                        AS TestResult,
  COALESCE(ther.TreatmentType, CAST([] AS ARRAY<STRING>))            AS TreatmentType,
  CAST([] AS ARRAY<STRING>)                                           AS organType
FROM `htan2-dcc.htan2_medallion_gold.gold_RELEASED_METADATA_TABLE_All_Records_Demographics` d
LEFT JOIN (
  SELECT
    HTAN_PARTICIPANT_ID,
    AGE_IN_DAYS_AT_DIAGNOSIS,
    PRIMARY_DIAGNOSIS_NCI_THESAURUS_ID,
    TISSUE_OR_ORGAN_OF_ORIGIN_UBERON_CODE,
    TUMOR_GRADE,
    LAST_KNOWN_DISEASE_STATUS,
    AGE_IN_DAYS_AT_LAST_KNOWN_DISEASE_STATUS,
    METHOD_OF_DIAGNOSIS,
    METASTASIS_AT_DIAGNOSIS,
    TUMOR_CLASSIFICATION_CATEGORY,
    CLINICAL_M_STAGE,
    CLINICAL_N_STAGE,
    TUMOR_STAGED,
    CLINICAL_T_STAGE,
    AJCC_STAGING_SYSTEM_EDITION
  FROM `htan2-dcc.htan2_medallion_gold.gold_RELEASED_METADATA_TABLE_All_Records_Diagnosis`
) diag ON d.HTAN_PARTICIPANT_ID = diag.HTAN_PARTICIPANT_ID
LEFT JOIN vital_agg  v    ON d.HTAN_PARTICIPANT_ID = v.HTAN_PARTICIPANT_ID
LEFT JOIN therapy_agg ther ON d.HTAN_PARTICIPANT_ID = ther.HTAN_PARTICIPANT_ID
LEFT JOIN molecular_agg mol ON d.HTAN_PARTICIPANT_ID = mol.HTAN_PARTICIPANT_ID;


-- ============================================================
-- VIEW: phase1_files
-- Phase 1 table: files
-- Sources: UNION ALL of all gold_RELEASED_METADATA_TABLE_All_Files_* tables,
--          joined with provenance and clinical tables.
--
-- Column mapping notes:
--   synapseId    <- File_EntityId
--   atlasid      <- LOWER(REGEXP_EXTRACT(HTAN_DATA_FILE_ID, r'^(HTA[0-9]+)'))
--   atlas_name   <- HTAN_Center
--   level        <- REGEXP_EXTRACT(Component, r'Level[0-9]+(?:and[0-9]+)?')
--   assayName    <- REGEXP_REPLACE(Component, r'Level[0-9]+(?:and[0-9]+)?$', '')
--   Filename     <- FILENAME
--   FileFormat   <- FILE_FORMAT
--   DataFileID   <- HTAN_DATA_FILE_ID
--   ParentDataFileID <- HTAN_PARENT_ID
--   biospecimenIds   <- ARRAY_AGG(HTAN_ASSAYED_BIOSPECIMEN_ID) from provenance
--   Gender/Race/Ethnicity/VitalStatus <- ARRAY_AGG from demographics/vital status via provenance
--   TreatmentType  <- ARRAY_AGG from therapy via provenance
--   PrimaryDiagnosis/TissueorOrganofOrigin <- ARRAY_AGG from diagnosis via provenance
--   ScRNAseqWorkflowType   <- SCRNASEQ_WORKFLOW_TYPE (scRNA tables only; NULL elsewhere)
--   ScRNAseqWorkflowParametersDescription <- SCRNASEQ_WORKFLOW_PARAMETERS_DESCRIPTION (scRNAL3/4 only)
--   WorkflowVersion/WorkflowLink <- WORKFLOW_VERSION/WORKFLOW_LINK (WES L2/L3 and scRNA L2/L3-4)
--   viewers      <- '{}' (default; no equivalent in Phase 2)
--   viewersArr   <- [] (derived from viewers; empty by default)
--   downloadSource/releaseVersion <- '' (not available in Phase 2)
--   organType    <- [] (computed from tissue mapping; not available in SQL only)
--   imageChannelMetadata <- '' (not available in Phase 2)
--   publicationIds       <- [] (not available in Phase 2)
--   isRawSequencing <- 'true' when level = 'Level1', 'false' otherwise
-- ============================================================
CREATE OR REPLACE VIEW `htan2-dcc.htan2_data_portal.phase1_files` AS
WITH

  -- ── Step 1: UNION ALL file metadata tables ──────────────────────────────────
  all_files AS (
    SELECT
      File_EntityId,
      FILENAME,
      FILE_FORMAT,
      Component,
      HTAN_DATA_FILE_ID,
      HTAN_PARENT_ID,
      HTAN_Center,
      CAST(NULL AS STRING) AS SCRNASEQ_WORKFLOW_TYPE,
      CAST(NULL AS STRING) AS SCRNASEQ_WORKFLOW_PARAMETERS_DESCRIPTION,
      CAST(NULL AS STRING) AS WORKFLOW_VERSION,
      CAST(NULL AS STRING) AS WORKFLOW_LINK
    FROM `htan2-dcc.htan2_medallion_gold.gold_RELEASED_METADATA_TABLE_All_Files_BulkWESLevel1`

    UNION ALL
    SELECT
      File_EntityId, FILENAME, FILE_FORMAT, Component, HTAN_DATA_FILE_ID, HTAN_PARENT_ID, HTAN_Center,
      CAST(NULL AS STRING),
      CAST(NULL AS STRING),
      WORKFLOW_VERSION,
      WORKFLOW_LINK
    FROM `htan2-dcc.htan2_medallion_gold.gold_RELEASED_METADATA_TABLE_All_Files_BulkWESLevel2`

    UNION ALL
    SELECT
      File_EntityId, FILENAME, FILE_FORMAT, Component, HTAN_DATA_FILE_ID, HTAN_PARENT_ID, HTAN_Center,
      CAST(NULL AS STRING),
      CAST(NULL AS STRING),
      WORKFLOW_VERSION,
      WORKFLOW_LINK
    FROM `htan2-dcc.htan2_medallion_gold.gold_RELEASED_METADATA_TABLE_All_Files_BulkWESLevel3`

    UNION ALL
    SELECT
      File_EntityId, FILENAME, FILE_FORMAT, Component, HTAN_DATA_FILE_ID, HTAN_PARENT_ID, HTAN_Center,
      CAST(NULL AS STRING),
      CAST(NULL AS STRING),
      CAST(NULL AS STRING),
      CAST(NULL AS STRING)
    FROM `htan2-dcc.htan2_medallion_gold.gold_RELEASED_METADATA_TABLE_All_Files_MultiplexMicroscopyLevel2`

    UNION ALL
    SELECT
      File_EntityId, FILENAME, FILE_FORMAT, Component, HTAN_DATA_FILE_ID, HTAN_PARENT_ID, HTAN_Center,
      CAST(NULL AS STRING),
      CAST(NULL AS STRING),
      CAST(NULL AS STRING),
      CAST(NULL AS STRING)
    FROM `htan2-dcc.htan2_medallion_gold.gold_RELEASED_METADATA_TABLE_All_Files_MultiplexMicroscopyLevel3`

    UNION ALL
    SELECT
      File_EntityId, FILENAME, FILE_FORMAT, Component, HTAN_DATA_FILE_ID, HTAN_PARENT_ID, HTAN_Center,
      CAST(NULL AS STRING),
      CAST(NULL AS STRING),
      CAST(NULL AS STRING),
      CAST(NULL AS STRING)
    FROM `htan2-dcc.htan2_medallion_gold.gold_RELEASED_METADATA_TABLE_All_Files_MultiplexMicroscopyLevel4`

    UNION ALL
    SELECT
      File_EntityId, FILENAME, FILE_FORMAT, Component, HTAN_DATA_FILE_ID, HTAN_PARENT_ID, HTAN_Center,
      CAST(NULL AS STRING),
      CAST(NULL AS STRING),
      CAST(NULL AS STRING),
      CAST(NULL AS STRING)
    FROM `htan2-dcc.htan2_medallion_gold.gold_RELEASED_METADATA_TABLE_All_Files_scRNALevel1`

    UNION ALL
    SELECT
      File_EntityId, FILENAME, FILE_FORMAT, Component, HTAN_DATA_FILE_ID, HTAN_PARENT_ID, HTAN_Center,
      SCRNASEQ_WORKFLOW_TYPE,
      CAST(NULL AS STRING),
      WORKFLOW_VERSION,
      WORKFLOW_LINK
    FROM `htan2-dcc.htan2_medallion_gold.gold_RELEASED_METADATA_TABLE_All_Files_scRNALevel2`

    UNION ALL
    SELECT
      File_EntityId, FILENAME, FILE_FORMAT, Component, HTAN_DATA_FILE_ID, HTAN_PARENT_ID, HTAN_Center,
      SCRNASEQ_WORKFLOW_TYPE,
      SCRNASEQ_WORKFLOW_PARAMETERS_DESCRIPTION,
      WORKFLOW_VERSION,
      WORKFLOW_LINK
    FROM `htan2-dcc.htan2_medallion_gold.gold_RELEASED_METADATA_TABLE_All_Files_scRNALevel3and4`

    UNION ALL
    SELECT
      File_EntityId, FILENAME, FILE_FORMAT, Component, HTAN_DATA_FILE_ID, HTAN_PARENT_ID, HTAN_Center,
      CAST(NULL AS STRING),
      CAST(NULL AS STRING),
      CAST(NULL AS STRING),
      CAST(NULL AS STRING)
    FROM `htan2-dcc.htan2_medallion_gold.gold_RELEASED_METADATA_TABLE_All_Files_DigitalPathology`

    UNION ALL
    SELECT
      File_EntityId, FILENAME, FILE_FORMAT, Component, HTAN_DATA_FILE_ID, HTAN_PARENT_ID, HTAN_Center,
      CAST(NULL AS STRING),
      CAST(NULL AS STRING),
      CAST(NULL AS STRING),
      CAST(NULL AS STRING)
    FROM `htan2-dcc.htan2_medallion_gold.gold_RELEASED_METADATA_TABLE_All_Files_SpatialLevel1`

    UNION ALL
    SELECT
      File_EntityId, FILENAME, FILE_FORMAT, Component, HTAN_DATA_FILE_ID, HTAN_PARENT_ID, HTAN_Center,
      CAST(NULL AS STRING),
      CAST(NULL AS STRING),
      CAST(NULL AS STRING),
      CAST(NULL AS STRING)
    FROM `htan2-dcc.htan2_medallion_gold.gold_RELEASED_METADATA_TABLE_All_Files_SpatialLevel3`

    UNION ALL
    SELECT
      File_EntityId, FILENAME, FILE_FORMAT, Component, HTAN_DATA_FILE_ID, HTAN_PARENT_ID, HTAN_Center,
      CAST(NULL AS STRING),
      CAST(NULL AS STRING),
      CAST(NULL AS STRING),
      CAST(NULL AS STRING)
    FROM `htan2-dcc.htan2_medallion_gold.gold_RELEASED_METADATA_TABLE_All_Files_SpatialLevel4`
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

  -- ── Step 5: Clinical aggregations per file via participants ─────────────────

  -- Demographics
  file_demographics AS (
    SELECT
      fpm.HTAN_DATA_FILE_ID,
      ARRAY_AGG(DISTINCT d.SEX          IGNORE NULLS) AS Gender,
      ARRAY_AGG(DISTINCT d.RACE         IGNORE NULLS) AS Race,
      ARRAY_AGG(DISTINCT d.ETHNIC_GROUP IGNORE NULLS) AS Ethnicity,
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
      ARRAY_AGG(DISTINCT vs.VITAL_STATUS IGNORE NULLS) AS VitalStatus
    FROM file_participant_map fpm
    JOIN `htan2-dcc.htan2_medallion_gold.gold_RELEASED_METADATA_TABLE_All_Records_VitalStatus` vs
      ON fpm.HTAN_PARTICIPANT_ID = vs.HTAN_PARTICIPANT_ID
    GROUP BY fpm.HTAN_DATA_FILE_ID
  ),

  -- Therapy
  file_therapy AS (
    SELECT
      fpm.HTAN_DATA_FILE_ID,
      ARRAY_AGG(DISTINCT t.TREATMENT_TYPE IGNORE NULLS) AS TreatmentType,
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
      ARRAY_AGG(DISTINCT diag.PRIMARY_DIAGNOSIS_NCI_THESAURUS_ID    IGNORE NULLS) AS PrimaryDiagnosis,
      ARRAY_AGG(DISTINCT diag.TISSUE_OR_ORGAN_OF_ORIGIN_UBERON_CODE IGNORE NULLS) AS TissueorOrganofOrigin,
      ARRAY_AGG(DISTINCT fpm.HTAN_PARTICIPANT_ID IGNORE NULLS) AS diagnosisIds
    FROM file_participant_map fpm
    JOIN `htan2-dcc.htan2_medallion_gold.gold_RELEASED_METADATA_TABLE_All_Records_Diagnosis` diag
      ON fpm.HTAN_PARTICIPANT_ID = diag.HTAN_PARTICIPANT_ID
    GROUP BY fpm.HTAN_DATA_FILE_ID
  )

-- ── Final SELECT ──────────────────────────────────────────────────────────────
SELECT
  f.File_EntityId                                                     AS synapseId,
  LOWER(REGEXP_EXTRACT(f.HTAN_DATA_FILE_ID, r'^(HTA[0-9]+)'))        AS atlasid,
  f.HTAN_Center                                                       AS atlas_name,
  COALESCE(REGEXP_EXTRACT(f.Component, r'Level[0-9]+(?:and[0-9]+)?'), '') AS level,
  REGEXP_REPLACE(f.Component, r'Level[0-9]+(?:and[0-9]+)?$', '')     AS assayName,
  f.FILENAME                                                          AS Filename,
  f.FILE_FORMAT                                                       AS FileFormat,
  f.Component,
  f.HTAN_DATA_FILE_ID                                                 AS DataFileID,
  f.HTAN_PARENT_ID                                                    AS ParentDataFileID,
  COALESCE(fb.biospecimenIds,   CAST([] AS ARRAY<STRING>))            AS biospecimenIds,
  COALESCE(fd.Gender,           CAST([] AS ARRAY<STRING>))            AS Gender,
  COALESCE(fd.Ethnicity,        CAST([] AS ARRAY<STRING>))            AS Ethnicity,
  COALESCE(fd.Race,             CAST([] AS ARRAY<STRING>))            AS Race,
  COALESCE(fv.VitalStatus,      CAST([] AS ARRAY<STRING>))            AS VitalStatus,
  COALESCE(ft.TreatmentType,    CAST([] AS ARRAY<STRING>))            AS TreatmentType,
  COALESCE(fdia.PrimaryDiagnosis,       CAST([] AS ARRAY<STRING>))    AS PrimaryDiagnosis,
  COALESCE(fdia.TissueorOrganofOrigin,  CAST([] AS ARRAY<STRING>))    AS TissueorOrganofOrigin,
  COALESCE(f.SCRNASEQ_WORKFLOW_TYPE, '')                              AS ScRNAseqWorkflowType,
  COALESCE(f.SCRNASEQ_WORKFLOW_PARAMETERS_DESCRIPTION, '')            AS ScRNAseqWorkflowParametersDescription,
  COALESCE(f.WORKFLOW_VERSION, '')                                    AS WorkflowVersion,
  COALESCE(f.WORKFLOW_LINK, '')                                       AS WorkflowLink,
  ''                                                                  AS AtlasMeta,
  ''                                                                  AS imageChannelMetadata,
  CAST([] AS ARRAY<STRING>)                                           AS publicationIds,
  COALESCE(fdia.diagnosisIds,   CAST([] AS ARRAY<STRING>))            AS diagnosisIds,
  COALESCE(fd.demographicsIds,  CAST([] AS ARRAY<STRING>))            AS demographicsIds,
  COALESCE(ft.therapyIds,       CAST([] AS ARRAY<STRING>))            AS therapyIds,
  '{}'                                                                AS viewers,
  CAST([] AS ARRAY<STRING>)                                           AS viewersArr,
  IF(REGEXP_CONTAINS(f.Component, r'Level1$'), 'true', 'false')       AS isRawSequencing,
  ''                                                                  AS downloadSource,
  ''                                                                  AS releaseVersion,
  CAST([] AS ARRAY<STRING>)                                           AS organType
FROM all_files f
LEFT JOIN file_biospecimens  fb   ON f.HTAN_DATA_FILE_ID = fb.HTAN_DATA_FILE_ID
LEFT JOIN file_demographics  fd   ON f.HTAN_DATA_FILE_ID = fd.HTAN_DATA_FILE_ID
LEFT JOIN file_vital         fv   ON f.HTAN_DATA_FILE_ID = fv.HTAN_DATA_FILE_ID
LEFT JOIN file_therapy       ft   ON f.HTAN_DATA_FILE_ID = ft.HTAN_DATA_FILE_ID
LEFT JOIN file_diagnosis     fdia ON f.HTAN_DATA_FILE_ID = fdia.HTAN_DATA_FILE_ID;


-- ============================================================
-- VIEW: phase1_publication_manifest
-- Phase 1 table: publication_manifest
-- Phase 2 does not expose publication data in the gold_RELEASED_* tables.
-- This view returns an empty result set with the correct Phase 1 schema
-- as a placeholder until publication data becomes available.
-- ============================================================
CREATE OR REPLACE VIEW `htan2-dcc.htan2_data_portal.phase1_publication_manifest` AS
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
WHERE FALSE;
