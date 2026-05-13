import { tool } from 'ai';
import { z } from 'zod';
import { createClient } from '@clickhouse/client-web';
import type { WebClickHouseClient } from '@clickhouse/client-web/dist/client';

import {
    DEFAULT_CLICKHOUSE_DB,
    DEFAULT_CLICKHOUSE_HOST,
} from '@htan/data-portal-commons';
import { validateSql } from './sqlGuard';

const QUERY_MAX_RESULT_ROWS = 1000;
const QUERY_MAX_EXECUTION_SECONDS = 15;
const QUERY_MAX_MEMORY_BYTES = 500_000_000; // 500 MB

let _serverClient: WebClickHouseClient | undefined;

function getServerClient(): WebClickHouseClient {
    if (_serverClient) return _serverClient;
    const password = process.env.NEXT_PUBLIC_CLICKHOUSE_PASSWORD;
    if (!password) {
        throw new Error(
            'NEXT_PUBLIC_CLICKHOUSE_PASSWORD is required for the chat backend.'
        );
    }
    const host =
        process.env.NEXT_PUBLIC_CLICKHOUSE_HOST ?? DEFAULT_CLICKHOUSE_HOST;
    const db = process.env.NEXT_PUBLIC_CLICKHOUSE_DB ?? DEFAULT_CLICKHOUSE_DB;
    const url = process.env.NEXT_PUBLIC_CLICKHOUSE_URL ?? `${host}/${db}`;
    _serverClient = createClient({
        url,
        username: process.env.NEXT_PUBLIC_CLICKHOUSE_USER ?? 'htanwebuser',
        password,
        request_timeout: 20_000,
        compression: { response: true, request: false },
    });
    return _serverClient;
}

export interface RunQuerySuccess {
    ok: true;
    sql: string;
    rowCount: number;
    rows: unknown[];
    truncated: boolean;
}

export interface RunQueryFailure {
    ok: false;
    sql: string;
    error: string;
    hint?: string;
}

export type RunQueryResult = RunQuerySuccess | RunQueryFailure;

function hintFromClickHouseError(message: string): string | undefined {
    if (/Unrecognized token/.test(message) && /!=/.test(message)) {
        return 'Use `<>` instead of `!=` in ClickHouse.';
    }
    if (/Missing columns|UNKNOWN_IDENTIFIER/.test(message)) {
        return 'Column name not found. Re-check the schema — column names are case-sensitive (e.g. `level` is lowercase, `organType` not `organ`).';
    }
    if (/ILLEGAL_TYPE_OF_ARGUMENT/.test(message) || /Array/.test(message)) {
        return 'For Array(String) columns (organType, Gender, PrimaryDiagnosis, ...), use `arrayExists(x -> x = ...)` or `arrayJoin(col)` instead of direct comparisons.';
    }
    if (/CANNOT_PARSE_TEXT|CANNOT_PARSE_INPUT/.test(message)) {
        return 'Wrap stringy numeric columns (DaystoBirth, AgeatDiagnosis) in `toInt32OrNull()` before arithmetic.';
    }
    return undefined;
}

export function makeRunQueryTool() {
    return tool({
        description:
            'Execute a read-only ClickHouse SELECT (or WITH-prefixed) query against the HTAN portal database. The query is validated against an allowlist before execution. Returns up to 1000 rows. Use this for every question that needs data — do not fabricate results.',
        inputSchema: z.object({
            sql: z
                .string()
                .min(1)
                .describe(
                    'A single ClickHouse SELECT or WITH query. Reference only these tables: atlases, cases, demographics, diagnosis, files, publication_manifest, specimen. No semicolons or stacked statements.'
                ),
        }),
        execute: async ({ sql }): Promise<RunQueryResult> => {
            const guard = validateSql(sql);
            if (!guard.safe) {
                return {
                    ok: false,
                    sql,
                    error: guard.reason ?? 'SQL failed validation.',
                    hint:
                        'Rewrite the SQL to be a single SELECT/WITH against the seven-table allowlist.',
                };
            }

            try {
                const client = getServerClient();
                const resultSet = await client.query({
                    query: guard.normalizedSql,
                    format: 'JSONEachRow',
                    clickhouse_settings: {
                        max_execution_time: QUERY_MAX_EXECUTION_SECONDS,
                        // sentinel: ask for one more than the cap so we can detect truncation
                        max_result_rows: String(QUERY_MAX_RESULT_ROWS + 1),
                        max_memory_usage: String(QUERY_MAX_MEMORY_BYTES),
                        readonly: '1',
                    },
                });
                const rows = (await resultSet.json()) as unknown[];
                const truncated = rows.length > QUERY_MAX_RESULT_ROWS;
                const safeRows = truncated
                    ? rows.slice(0, QUERY_MAX_RESULT_ROWS)
                    : rows;
                return {
                    ok: true,
                    sql: guard.normalizedSql,
                    rowCount: safeRows.length,
                    rows: safeRows,
                    truncated,
                };
            } catch (err) {
                const message =
                    err instanceof Error ? err.message : String(err);
                return {
                    ok: false,
                    sql: guard.normalizedSql,
                    error: message,
                    hint: hintFromClickHouseError(message),
                };
            }
        },
    });
}
