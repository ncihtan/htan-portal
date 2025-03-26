import { createClient } from '@clickhouse/client-web';
import _ from 'lodash';

const client = createClient({
    host: 'https://mecgt250i0.us-east-1.aws.clickhouse.cloud:8443/htan',
    username: 'webuser',
    password: 'My_password1976',
    request_timeout: 600000,
    compression: {
        response: true,
        request: false,
    },
    config: {
        session_timeout: 60,
        // output_format_json_quote_64bit_integers: 0,
        // enable_http_compression: 0,
        max_connections: 10, // Set your desired pool size
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
    SELECT val, type, fieldType, count(Distinct Filename) as count FROM (
        SELECT Filename, arrayJoin(Gender) as val, 'Gender' as type, 'array' as  fieldType FROM files
        UNION ALL
        SELECT Filename, arrayJoin(Race) as val, 'Race' as type,  'array' as  fieldType FROM files
        UNION ALL
        SELECT Filename, arrayJoin(PrimaryDiagnosis) as val, 'PrimaryDiagnosis' as type,  'array' as  fieldType FROM files
        UNION ALL
        SELECT Filename, arrayJoin(Ethnicity) as val, 'Ethnicity' as type,'array' as fieldType FROM files
        UNION ALL
        SELECT Filename, arrayJoin(TissueorOrganofOrigin) as val, 'TissueorOrganofOrigin' as type,'array' as fieldType FROM files
        UNION ALL
        SELECT Filename, level as val, 'level' as typ, 'string' as fieldType FROM files
        UNION ALL
        SELECT Filename, assayName as val, 'assayName' as type, 'string' as  fieldType FROM files
        UNION ALL
        SELECT Filename, arrayJoin(TreatmentType) as val, 'TreatmentType' as type, 'array' as fieldType FROM files
        UNION ALL
        SELECT Filename, FileFormat as val, 'FileFormat' as type, 'string' as fieldType  FROM files
        UNION ALL
        SELECT Filename, arrayJoin(viewersArr) as val, 'viewersArr' as type, 'array' as fieldType FROM files
        UNION ALL
        SELECT Filename, atlas_name as val, 'AtlasName' as type, 'string' as fieldType FROM files
        )
    GROUP BY val, type, fieldType
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
            SELECT * FROM specimen c
                       WHERE specimen.ParentID IN (
                           SELECT demographicsIds as moo FROM files f
                           ARRAY JOIN demographicsIds
                     <%=this.filterString%>)`);

export async function doQuery(str: any) {
    console.log(str);
    const resultSet = await client.query({
        query: str,
        format: 'JSONEachRow',
    });
    return await resultSet.json();
}

export const fileQuery = `
SELECT synapseId,
atlasid,
atlas_name,
level,
assayName,
Filename,
FileFormat,
DataFileID,
biospecimenIds,
Gender,
Ethnicity,
Race,
VitalStatus,
TreatmentType,
PrimaryDiagnosis,
TissueorOrganofOrigin,
ScRNAseqWorkflowType,
ScRNAseqWorkflowParametersDescription,
WorkflowVersion,
WorkflowLink,
publicationIds,
diagnosisIds,
demographicsIds,
therapyIds,
viewers,
isRawSequencing,
downloadSource,
releaseVersion 
FROM files
`;
