import { createClient } from '@clickhouse/client-web';
import type { NextApiRequest, NextApiResponse } from 'next';
import { DEFAULT_CLICKHOUSE_URL } from '@htan/data-portal-commons';

if (!process.env.CLICKHOUSE_PASSWORD) {
    throw new Error(
        'CLICKHOUSE_PASSWORD environment variable is not set. ' +
            'Copy .env.local.example to .env.local and fill in the credentials.'
    );
}

// Singleton client — reused across requests to avoid per-request overhead
const client = createClient({
    url: process.env.CLICKHOUSE_URL ?? DEFAULT_CLICKHOUSE_URL,
    username: process.env.CLICKHOUSE_USER ?? 'htanwebuser',
    password: process.env.CLICKHOUSE_PASSWORD,
    request_timeout: 600000,
    compression: {
        response: true,
        request: false,
    },
});

// Only allow read-only query types to prevent misuse of the proxy endpoint
const ALLOWED_QUERY_PATTERN = /^\s*(SELECT|WITH)\s/i;

export const config = { maxDuration: 120 }

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { query } = req.body;

    if (!query || typeof query !== 'string') {
        return res.status(400).json({ error: 'Invalid query' });
    }

    if (!ALLOWED_QUERY_PATTERN.test(query)) {
        return res
            .status(400)
            .json({ error: 'Only SELECT queries are permitted' });
    }

    try {
        const resultSet = await client.query({
            query,
            format: 'JSONEachRow',
        });
        const data = await resultSet.json();
        res.status(200).json(data);
    } catch (error) {
        const message =
            error instanceof Error ? error.message : 'Unknown error';
        console.error('ClickHouse query error:', message);
        res.status(500).json({ error: `Query failed: ${message}` });
    }
}
