import { createClient } from '@clickhouse/client';
import _ from 'lodash';

const client = createClient({
    host:
        process.env.CLICKHOUSE_HOST ??
        'https://mecgt250i0.us-east-1.aws.clickhouse.cloud:8443/htan2',
    username: process.env.CLICKHOUSE_USER ?? 'app_user',
    password: process.env.CLICKHOUSE_PASSWORD,
    request_timeout: 600000,
    compression: {
        response: false,
        request: false,
    },
});

export async function doQuery(str) {
    const resultSet = await client.query({
        query: str,
    });
    return resultSet;
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
    //const fields = Object.keys(data[0]);

    ///const fieldsWithData = _(fields).filter(f=>_.some(data,(r)=>r[f] != null)).value();

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

    //console.log(q);
    //console.log(data[0]);

    //return;

    await doQuery(q).then((r) => {});

    await client.insert({
        table: tableName,
        // structure should match the desired format, JSONEachRow in this example
        values: [data],
        format: 'JSONEachRow',
    });
}
