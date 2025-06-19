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
});

export const defaultCountsByTypeQueryFilterString = {
    genderFilterString: '',
    raceFilterString: '',
    primaryDiagnosisFilterString: '',
    ethnicityFilterString: '',
    tissueOrOrganOfOriginFilterString: '',
    levelFilterString: '',
    assayNameFilterString: '',
    treatmentTypeFilterString: '',
    fileFormatFilterString: '',
    viewersFilterString: '',
    organTypeFilterString: '',
    atlasNameFilterString: '',
    downloadSourceFilterString: '',
};

export const countsByTypeQuery = _.template(`
    WITH
        fileQueryForGender AS (SELECT viewersArr, * FROM files <%=genderFilterString%>),
        fileQueryForRace AS (SELECT viewersArr, * FROM files <%=raceFilterString%>),
        fileQueryForPrimaryDiagnosis AS (SELECT viewersArr, * FROM files <%=primaryDiagnosisFilterString%>),
        fileQueryForEthnicity AS (SELECT viewersArr, * FROM files <%=ethnicityFilterString%>),
        fileQueryForTissueOrOrganOfOrigin AS (SELECT viewersArr, * FROM files <%=tissueOrOrganOfOriginFilterString%>),
        fileQueryForLevel AS (SELECT viewersArr, * FROM files <%=levelFilterString%>),
        fileQueryForAssayName AS (SELECT viewersArr, * FROM files <%=assayNameFilterString%>),
        fileQueryForTreatmentType AS (SELECT viewersArr, * FROM files <%=treatmentTypeFilterString%>),
        fileQueryForFileFormat AS (SELECT viewersArr, * FROM files <%=fileFormatFilterString%>),
        fileQueryForViewers AS (SELECT viewersArr, * FROM files <%=viewersFilterString%>),
        fileQueryForOrganType AS (SELECT viewersArr, * FROM files <%=organTypeFilterString%>),
        fileQueryForAtlasName AS (SELECT viewersArr, * FROM files <%=atlasNameFilterString%>),
        fileQueryForDownloadSource AS (SELECT viewersArr, * FROM files <%=downloadSourceFilterString%>)
    SELECT val, type, fieldType, count(Distinct Filename) as count FROM (
        SELECT Filename, arrayJoin(Gender) as val, 'Gender' as type, 'array' as  fieldType FROM fileQueryForGender
        UNION ALL
        SELECT Filename, arrayJoin(Race) as val, 'Race' as type,  'array' as  fieldType FROM fileQueryForRace
        UNION ALL
        SELECT Filename, arrayJoin(PrimaryDiagnosis) as val, 'PrimaryDiagnosis' as type,  'array' as  fieldType FROM fileQueryForPrimaryDiagnosis
        UNION ALL
        SELECT Filename, arrayJoin(Ethnicity) as val, 'Ethnicity' as type,'array' as fieldType FROM fileQueryForEthnicity
        UNION ALL
        SELECT Filename, arrayJoin(TissueorOrganofOrigin) as val, 'TissueorOrganofOrigin' as type,'array' as fieldType FROM fileQueryForTissueOrOrganOfOrigin
        UNION ALL
        SELECT Filename, level as val, 'level' as typ, 'string' as fieldType FROM fileQueryForLevel
        UNION ALL
        SELECT Filename, assayName as val, 'assayName' as type, 'string' as  fieldType FROM fileQueryForAssayName
        UNION ALL
        SELECT Filename, arrayJoin(TreatmentType) as val, 'TreatmentType' as type, 'array' as fieldType FROM fileQueryForTreatmentType
        UNION ALL
        SELECT Filename, FileFormat as val, 'FileFormat' as type, 'string' as fieldType  FROM fileQueryForFileFormat
        UNION ALL
        SELECT Filename, arrayJoin(viewersArr) as val, 'viewersArr' as type, 'array' as fieldType FROM fileQueryForViewers
        UNION ALL
        SELECT Filename, arrayJoin(organType) as val, 'organType' as type, 'array' as fieldType FROM fileQueryForOrganType
        UNION ALL
        SELECT Filename, atlas_name as val, 'AtlasName' as type, 'string' as fieldType FROM fileQueryForAtlasName
        UNION ALL
        SELECT Filename, downloadSource as val, 'downloadSource' as type, 'string' as fieldType FROM fileQueryForDownloadSource
        )
    WHERE notEmpty(val)                                                                 
    GROUP BY val, type, fieldType
`);

//export const countsByTypeQueryMOO = _.template(countsByTypeQueryFiltered);

export async function doQuery<T>(str: any): Promise<T[]> {
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
releaseVersion,
Component
FROM files
`;

export const atlasQuery = _.template(`
    SELECT * FROM atlases
    WHERE htan_id IN (
        SELECT files.atlasid FROM files
        <%=filterString%>
        )
`);

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
                       WHERE specimen.BiospecimenID IN (
                           SELECT biospecimenIds FROM files f
                           ARRAY JOIN biospecimenIds
                     <%=filterString%>)`);

export const assayQuery = _.template(`
    SELECT * FROM files WHERE has(files.publicationIds,'<%=publicationId %>')
`);

export const plotQuery = _.template(
    `SELECT <%=field%> as label, count(<%=field%>) as count FROM <%=table%> c
    WHERE c.ParticipantID IN (
              SELECT ids FROM files f
                           ARRAY JOIN demographicsIds as ids
                    <%=filterString%>
    )
  GROUP BY <%=field%>`
);

export const assayPlotQuery = _.template(
    `
            SELECT assayName as label, count(DISTINCT demographic_id) as count FROM (
                SELECT demographic_id, assayName
                FROM files
                ARRAY JOIN demographicsIds AS demographic_id
                    <%=filterString%>
        ) GROUP BY assayName
    `
);
