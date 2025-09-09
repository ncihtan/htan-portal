import _ from 'lodash';
import { createClient } from '@clickhouse/client';
import { DEFAULT_CLICKHOUSE_URL } from '@htan/data-portal-commons';

const client = createClient({
    url: process.env.CLICKHOUSE_HOST ?? DEFAULT_CLICKHOUSE_URL,
    username: process.env.CLICKHOUSE_USER ?? 'app_user',
    password: process.env.CLICKHOUSE_PASSWORD,
    request_timeout: 600000,
    compression: {
        response: false,
        request: false,
    },
});

export async function doQuery(query) {
    return client.query({ query });
}

function correctFieldName(f) {
    return f.replace(/-associated/, 'Associated');
}

export async function createTable(
    tableName,
    data,
    fields,
    derivedColumns = null
) {
    const q = `CREATE OR REPLACE TABLE ${tableName}
        (
            ${fields
                .map((f) => {
                    const ff = f.replace(/^.*\./, '');
                    //const fieldType = _.isArray(data[0][f]) ? "Array(TEXT)" : "TEXT";
                    const fieldType = _.some(data, (d) => _.isArray(d[ff]))
                        ? 'Array(TEXT)'
                        : 'TEXT';
                    return `${correctFieldName(ff)} ${fieldType}`;
                })
                .join(', ')}${
        derivedColumns ? ',' + derivedColumns.join(',') : ''
    } 
        )          
            ENGINE = MergeTree
            ORDER BY ${fields[0]}
      `;

    await doQuery(q).then((r) => {});

    await client.insert({
        table: tableName,
        // structure should match the desired format, JSONEachRow in this example
        values: [data],
        format: 'JSONEachRow',
    });
}
