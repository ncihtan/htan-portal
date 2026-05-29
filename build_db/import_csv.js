/**
 * import_csv.js
 *
 * Simplified importer for Phase 2 data.
 *
 * Usage:
 *   node build_db/import_csv.js <path-to-csv-file> [table-name]
 *
 * Environment variables (same as main.js):
 *   CLICKHOUSE_DB      – target database name (e.g. htan2_123)
 *   CLICKHOUSE_HOST    – ClickHouse host URL
 *   CLICKHOUSE_URL     – full URL (overrides HOST + DB)
 *   CLICKHOUSE_USER    – admin username (default: htan_admin)
 *   CLICKHOUSE_PASSWORD
 */

import { createDbIfNotExist, createTable } from './client.js';
import csv from 'csvtojson';
import path from 'path';

const csvFilePath = process.argv[2] ?? 'data/phase2_gold.csv';

const tableName = process.argv[3] || 'files';

/**
 * Mapping from Phase 2 CSV header names to the DB column names expected by
 * the existing `fileQuery` and `countsByTypeQuery` in clickhouseHelpers.ts.
 */
const COLUMN_MAPPING = {
    File_EntityId: 'synapseId',
    File_Name: 'Filename',
    HTAN_Center: 'atlas_name',
    HTAN_DATA_FILE_ID: 'DataFileID',
    HTAN_PARENT_ID: 'ParentDataFileID',
};

/**
 * TEXT columns that must exist in the files table but are not present in the
 * Phase 2 CSV.  These are added with an empty-string default so that the
 * existing queries do not throw "Unknown expression identifier" errors.
 * `viewers` uses an empty JSON object so that the materialized `viewersArr`
 * column (derived via JSONExtractKeys) resolves to an empty array rather than
 * causing a JSON parse error.
 */
const EMPTY_TEXT_COLUMNS = [
    'atlasid',
    'level',
    'assayName',
    'FileFormat',
    'VitalStatus',
    'ScRNAseqWorkflowType',
    'ScRNAseqWorkflowParametersDescription',
    'WorkflowVersion',
    'WorkflowLink',
    'downloadSource',
    'releaseVersion',
    'imageChannelMetadata',
];

/**
 * Array(TEXT) columns that must exist in the files table but are not present
 * in the Phase 2 CSV.  These are added with an empty-array default so that
 * `arrayJoin` calls in the existing queries return zero rows rather than
 * throwing errors.
 */
const EMPTY_ARRAY_COLUMNS = [
    'biospecimenIds',
    'Gender',
    'Ethnicity',
    'Race',
    'TreatmentType',
    'PrimaryDiagnosis',
    'TissueorOrganofOrigin',
    'publicationIds',
    'diagnosisIds',
    'demographicsIds',
    'therapyIds',
    'organType',
];

/**
 * Derived / materialized columns – mirrors what main.js creates so that the
 * files table is fully compatible with the existing portal queries.
 */
const DERIVED_COLUMNS = [
    "viewersArr Array(TEXT) MATERIALIZED JSONExtractKeys(viewers)",
];

/**
 * Apply column renaming and add empty placeholder columns to every CSV row so
 * that the resulting ClickHouse table is compatible with the existing portal
 * queries.
 */
function normalizeRow(row) {
    const normalized = {};
    for (const [key, value] of Object.entries(row)) {
        const mappedKey = COLUMN_MAPPING[key] ?? key;
        normalized[mappedKey] = value;
    }
    for (const col of EMPTY_TEXT_COLUMNS) {
        if (!(col in normalized)) normalized[col] = '';
    }
    // `viewers` stores a JSON object; default to '{}' so the derived
    // `viewersArr` materialized column (JSONExtractKeys) returns [] not an error.
    if (!('viewers' in normalized)) normalized['viewers'] = '{}';
    for (const col of EMPTY_ARRAY_COLUMNS) {
        if (!(col in normalized)) normalized[col] = [];
    }
    return normalized;
}

async function main() {
    console.log(`Reading CSV file: ${csvFilePath}`);
    const rawRows = await csv().fromFile(path.resolve(csvFilePath));

    if (rawRows.length === 0) {
        console.error('No rows found in CSV file');
        process.exit(1);
    }

    console.log(`Parsed ${rawRows.length} rows from CSV`);

    const rows = rawRows.map(normalizeRow);

    // Derive column names from the union of all row keys
    const fields = [
        ...new Set(rows.flatMap((row) => Object.keys(row))),
    ].filter((f) => /^[a-z]/i.test(f));

    console.log(`Detected ${fields.length} columns: ${fields.join(', ')}`);

    await createDbIfNotExist();
    console.log(`Creating table '${tableName}'`);
    await createTable(tableName, rows, fields, DERIVED_COLUMNS);
    console.log(`Table '${tableName}' created and populated successfully`);
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
