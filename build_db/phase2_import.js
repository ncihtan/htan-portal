import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createDbIfNotExist, createTable } from './client.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const TABLES = [
    'atlases',
    'cases',
    'demographics',
    'diagnosis',
    'files',
    'specimen',
];

function normalizeScalarValue(value) {
    if (value == null) return '';
    if (typeof value === 'string') return value;
    if (typeof value === 'number' || typeof value === 'boolean') {
        return String(value);
    }
    // Objects are stored as JSON strings to fit TEXT columns.
    return JSON.stringify(value);
}

function normalizeArrayValue(value) {
    if (!Array.isArray(value)) {
        return [normalizeScalarValue(value)];
    }

    return value.map((item) => {
        if (item == null) return '';
        if (typeof item === 'string') return item;
        if (typeof item === 'number' || typeof item === 'boolean') {
            return String(item);
        }
        return JSON.stringify(item);
    });
}

function normalizeTreatmentValues(value) {
    const values = Array.isArray(value) ? value : [value];

    return values.flatMap((item) => {
        if (item == null) {
            return [];
        }

        if (typeof item !== 'string') {
            return [normalizeScalarValue(item)];
        }

        const trimmed = item.trim();
        if (!trimmed) {
            return [];
        }

        if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
            try {
                const parsed = JSON.parse(trimmed);
                return normalizeTreatmentValues(parsed);
            } catch (_error) {
                return trimmed
                    .slice(1, -1)
                    .split(',')
                    .map((part) => part.trim().replace(/^['"]|['"]$/g, ''))
                    .filter(Boolean);
            }
        }

        return [trimmed.replace(/^['"]|['"]$/g, '')];
    });
}

function normalizeRow(row) {
    const normalized = {};

    for (const [key, value] of Object.entries(row)) {
        if (key === 'TREATMENT_TYPE') {
            normalized[key] = normalizeTreatmentValues(value);
        } else {
            normalized[key] = Array.isArray(value)
                ? normalizeArrayValue(value)
                : normalizeScalarValue(value);
        }
    }

    return normalized;
}

function collectFields(rows) {
    const seen = new Set();
    const fields = [];

    for (const row of rows) {
        for (const key of Object.keys(row)) {
            if (!seen.has(key)) {
                seen.add(key);
                fields.push(key);
            }
        }
    }

    return fields;
}

function expandFilesRow(row) {
    if (!row.raw_file_metadata) {
        return row;
    }

    try {
        const parsed = JSON.parse(row.raw_file_metadata);
        if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
            const expanded = {
                ...parsed,
                ...row,
            };
            delete expanded.raw_file_metadata;
            return expanded;
        }
    } catch (_error) {
        // Keep original row if raw_file_metadata is malformed.
    }

    const fallback = { ...row };
    delete fallback.raw_file_metadata;
    return fallback;
}

async function parseRows(filePath) {
    const raw = await fs.readFile(filePath, 'utf8');
    const trimmed = raw.trim();

    if (!trimmed) return [];

    if (trimmed.startsWith('[')) {
        const parsed = JSON.parse(trimmed);
        if (!Array.isArray(parsed)) {
            throw new Error(`Expected JSON array in ${filePath}`);
        }
        return parsed;
    }

    // Fallback for NDJSON.
    return trimmed
        .split(/\r?\n/)
        .filter(Boolean)
        .map((line) => JSON.parse(line));
}

async function importTable(dataDir, tableName) {
    const filePath = path.join(dataDir, `htan2_${tableName}.json`);
    const rows = await parseRows(filePath);

    if (rows.length === 0) {
        console.log(`Skipping ${tableName}: no rows in ${filePath}`);
        return;
    }

    const expandedRows =
        tableName === 'files' ? rows.map(expandFilesRow) : rows;
    const normalizedRows = expandedRows.map(normalizeRow);
    const fields = collectFields(normalizedRows);

    console.log(
        `Importing ${tableName}: ${normalizedRows.length} row(s), ${fields.length} column(s)`
    );
    await createTable(tableName, normalizedRows, fields, []);
}

async function main() {
    const dataDir = path.resolve(__dirname, '../data/tmp/phase2');

    await createDbIfNotExist();

    for (const tableName of TABLES) {
        await importTable(dataDir, tableName);
    }

    console.log('Phase 2 JSON import complete.');
}

main().catch((error) => {
    console.error('Failed to import Phase 2 JSON files:', error);
    process.exit(1);
});
