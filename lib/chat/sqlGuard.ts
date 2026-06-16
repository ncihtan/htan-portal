// SQL guard for the HTAN chat backend.
//
// Mirrors the validation in ncihtan/htan-cli (src/htan/query/portal.py):
// - allow only read-only statements (starts with SELECT or WITH)
// - reject any DDL/DML keyword anywhere in the text
// - every referenced table must be in the seven-table portal allowlist

export const ALLOWED_TABLES = [
    'atlases',
    'cases',
    'demographics',
    'diagnosis',
    'files',
    'publication_manifest',
    'specimen',
] as const;

export type AllowedTable = typeof ALLOWED_TABLES[number];

const ALLOWED_STARTS = ['SELECT', 'WITH'] as const;

const BLOCKED_KEYWORDS = [
    'DELETE',
    'DROP',
    'UPDATE',
    'INSERT',
    'CREATE',
    'ALTER',
    'TRUNCATE',
    'MERGE',
    'GRANT',
    'REVOKE',
    'ATTACH',
    'DETACH',
    'OPTIMIZE',
    'SYSTEM',
    'RENAME',
    'REPLACE',
] as const;

export interface SqlGuardResult {
    safe: boolean;
    reason?: string;
    normalizedSql: string;
}

// Strip block comments (/* ... */) and line comments (-- to end of line) so they can't smuggle
// keywords past the validator.
function stripComments(sql: string): string {
    return sql.replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/--.*$/gm, ' ');
}

// ClickHouse rejects `!=`; the htan-cli normalises it to `<>` before sending.
function normalizeOperators(sql: string): string {
    return sql.replace(/\\!=/g, '<>').replace(/!=/g, '<>');
}

export function normalizeSql(sql: string): string {
    return normalizeOperators(sql).trim();
}

// Extract table names that appear after FROM or JOIN. Lightweight — we only need to confirm
// every such reference is in the allowlist; we don't need a full parser.
function extractReferencedTables(sql: string): string[] {
    const cleaned = stripComments(sql);
    const tables: string[] = [];
    const re = /\b(?:from|join)\s+([a-zA-Z_][a-zA-Z0-9_]*)/gi;
    let match: RegExpExecArray | null;
    while ((match = re.exec(cleaned)) !== null) {
        tables.push(match[1]);
    }
    return tables;
}

export function validateSql(rawSql: string): SqlGuardResult {
    const normalizedSql = normalizeSql(rawSql);
    if (!normalizedSql) {
        return {
            safe: false,
            reason: 'Empty SQL.',
            normalizedSql,
        };
    }

    const cleaned = stripComments(normalizedSql);
    const upperCleaned = cleaned.toUpperCase();
    const tokens = upperCleaned.split(/\s+/).filter(Boolean);
    const firstToken = tokens[0] ?? '';

    if (!ALLOWED_STARTS.includes(firstToken as typeof ALLOWED_STARTS[number])) {
        return {
            safe: false,
            reason: `SQL must start with one of: ${ALLOWED_STARTS.join(
                ', '
            )}. Got: ${firstToken || '(empty)'}`,
            normalizedSql,
        };
    }

    for (const keyword of BLOCKED_KEYWORDS) {
        const pattern = new RegExp(`\\b${keyword}\\b`, 'i');
        if (pattern.test(cleaned)) {
            return {
                safe: false,
                reason: `Blocked SQL keyword: ${keyword}. Only read-only queries are allowed.`,
                normalizedSql,
            };
        }
    }

    // Disallow stacked statements. ClickHouse executes one statement per request anyway,
    // but a stray `;` followed by anything is a smell.
    const stripped = cleaned.replace(/;\s*$/, '');
    if (stripped.includes(';')) {
        return {
            safe: false,
            reason:
                'Stacked statements are not allowed (only one query per request).',
            normalizedSql,
        };
    }

    const referenced = extractReferencedTables(cleaned);
    if (referenced.length === 0) {
        return {
            safe: false,
            reason:
                'Query does not reference any table. Use one of: ' +
                ALLOWED_TABLES.join(', '),
            normalizedSql,
        };
    }
    for (const t of referenced) {
        if (!(ALLOWED_TABLES as readonly string[]).includes(t)) {
            return {
                safe: false,
                reason: `Table '${t}' is not in the portal allowlist. Allowed: ${ALLOWED_TABLES.join(
                    ', '
                )}`,
                normalizedSql,
            };
        }
    }

    return { safe: true, normalizedSql };
}
