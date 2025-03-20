import { createClient } from '@clickhouse/client-web';
import _ from 'lodash';

const client = createClient({
    host: 'https://mecgt250i0.us-east-1.aws.clickhouse.cloud:8443/htan',
    username: 'app_user',
    password: 'P@ssword1976',
    request_timeout: 600000,
    compression: {
        response: true,
        request: false,
    },
});

// const client = createClient({
//     host: 'http://localhost:8123/default',
//     username: 'default',
//     password: 'moo',
//     request_timeout: 600000,
//     compression: {
//         response: true,
//         request: false,
//     },
// });

export const myQuery = `
    SELECT val, type, count(Distinct Filename) as count FROM (
        SELECT Filename, arrayJoin(Gender) as val, 'Gender' as type FROM files
        UNION ALL
        SELECT Filename, arrayJoin(Race) as val, 'Race' as type FROM files
        UNION ALL
        SELECT Filename, arrayJoin(PrimaryDiagnosis) as val, 'PrimaryDiagnosis' as type FROM files
        UNION ALL
        SELECT Filename, arrayJoin(Ethnicity) as val, 'Ethnicity' as type FROM files
        UNION ALL
        SELECT Filename, arrayJoin(TissueorOrganofOrigin) as val, 'TissueorOrganofOrigin' as type FROM files
        UNION ALL
        SELECT Filename, level as val, 'Level' as type FROM files
        UNION ALL
        SELECT Filename, assayName as val, 'assayName' as type FROM files
        UNION ALL
        SELECT Filename, FileFormat as val, 'FileFormat' as type FROM files
        UNION ALL
        SELECT Filename, viewers as val, 'viewers' as type FROM files

        )
    GROUP BY val, type
`;

export const caseQuery = _.template(
    `SELECT * FROM cases c
                                         JOIN diagnosis d ON c.ParticipantID = d.ParticipantID
                       WHERE cases.ParticipantID IN (
                           SELECT demographicsIds as moo FROM files f
                           ARRAY JOIN demographicsIds
                       <%=filterString%>
         )`
);

export const specimenQuery = _.template(`
            SELECT * FROM biospecimen c
                       WHERE biospecimen.ParentID IN (
                           SELECT demographicsIds as moo FROM files f
                           ARRAY JOIN demographicsIds
                     <%=this.filterString%>)`);

export async function doQuery(str: any) {
    const resultSet = await client.query({
        query: str,
        format: 'JSONEachRow',
    });
    return await resultSet.json();
}
