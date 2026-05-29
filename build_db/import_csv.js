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

const csvFilePath = process.argv[2] ?? '../data/phase2_gold.csv';

const tableName = process.argv[3] || 'files';

async function main() {
    console.log(`Reading CSV file: ${csvFilePath}`);
    const rows = await csv().fromFile(path.resolve(csvFilePath));

    if (rows.length === 0) {
        console.error('No rows found in CSV file');
        process.exit(1);
    }

    console.log(`Parsed ${rows.length} rows from CSV`);

    // Derive column names from the union of all row keys
    const fields = [
        ...new Set(rows.flatMap((row) => Object.keys(row))),
    ].filter((f) => /^[a-z]/i.test(f));

    console.log(`Detected ${fields.length} columns: ${fields.join(', ')}`);

    await createDbIfNotExist();
    console.log(`Creating table '${tableName}'`);
    await createTable(tableName, rows, fields);
    console.log(`Table '${tableName}' created and populated successfully`);
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
