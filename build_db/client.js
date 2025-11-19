import _ from 'lodash';
import { createClient } from '@clickhouse/client';
import {
    DEFAULT_CLICKHOUSE_DB,
    DEFAULT_CLICKHOUSE_HOST,
    DEFAULT_CLICKHOUSE_URL,
} from '@htan/data-portal-commons';

const clientConfig = {
    url: process.env.CLICKHOUSE_URL ?? DEFAULT_CLICKHOUSE_URL,
    username: process.env.CLICKHOUSE_USER ?? 'htan_admin',
    password: process.env.CLICKHOUSE_PASSWORD,
    request_timeout: 600000,
    compression: {
        response: false,
        request: false,
    },
};

const client = createClient(clientConfig);

export async function doQuery(query) {
    return client.query({ query });
}

function correctFieldName(f) {
    return f.replace(/-associated/, 'Associated');
}

export async function createDbIfNotExist(dbName = DEFAULT_CLICKHOUSE_DB) {
    // we need to create a separate client (without the DB name) to be able to create a new DB
    // otherwise we will get unknown database error
    const client = createClient({
        ...clientConfig,
        url: process.env.CLICKHOUSE_HOST ?? DEFAULT_CLICKHOUSE_HOST,
    });

    return client.query({ query: `CREATE DATABASE IF NOT EXISTS ${dbName}` });
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
