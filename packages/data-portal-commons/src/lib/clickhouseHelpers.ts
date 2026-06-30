import _ from 'lodash';
import { createClient } from '@clickhouse/client-web';
import { WebClickHouseClient } from '@clickhouse/client-web/dist/client';
import { SelectedFilter } from '@htan/data-portal-filter';

import { CountByType } from './types';

export const DEFAULT_CLICKHOUSE_HOST =
    'https://dl96orhu96.us-east-1.aws.clickhouse.cloud:8443';
export const DEFAULT_CLICKHOUSE_DB = 'htan2_0';
export const DEFAULT_PHASE2_CLICKHOUSE_DB = 'htan2_1';
export const DEFAULT_CLICKHOUSE_URL = `${DEFAULT_CLICKHOUSE_HOST}/${DEFAULT_CLICKHOUSE_DB}`;

function buildClickHouseUrl(): string {
    if (process.env.NEXT_PUBLIC_CLICKHOUSE_URL) {
        return process.env.NEXT_PUBLIC_CLICKHOUSE_URL;
    }
    const host =
        process.env.NEXT_PUBLIC_CLICKHOUSE_HOST ?? DEFAULT_CLICKHOUSE_HOST;
    const db = process.env.NEXT_PUBLIC_CLICKHOUSE_DB ?? DEFAULT_CLICKHOUSE_DB;
    return `${host}/${db}`;
}

function buildClickHouseUrlWithDatabase(database: string): string {
    const host =
        process.env.NEXT_PUBLIC_CLICKHOUSE_HOST ?? DEFAULT_CLICKHOUSE_HOST;
    return `${host}/${database}`;
}

let _defaultClient: WebClickHouseClient | undefined;
const _clientsByDatabase = new Map<string, WebClickHouseClient>();

function getClickhousePassword(): string {
    const clickhousePassword = process.env.NEXT_PUBLIC_CLICKHOUSE_PASSWORD;
    if (!clickhousePassword) {
        throw new Error(
            'NEXT_PUBLIC_CLICKHOUSE_PASSWORD is not configured. ' +
                'Set it in .env.local (for development) or in your hosting environment (for production).'
        );
    }

    return clickhousePassword;
}

function getDefaultClient(): WebClickHouseClient {
    if (!_defaultClient) {
        const clickhousePassword = getClickhousePassword();
        _defaultClient = createClient({
            url: buildClickHouseUrl(),
            username: process.env.NEXT_PUBLIC_CLICKHOUSE_USER ?? 'htanwebuser',
            password: clickhousePassword,
            request_timeout: 600000,
            compression: {
                response: true,
                request: false,
            },
        });
    }
    return _defaultClient;
}

export function getClientForDatabase(database: string): WebClickHouseClient {
    const cachedClient = _clientsByDatabase.get(database);
    if (cachedClient) {
        return cachedClient;
    }

    const client = createClient({
        url: buildClickHouseUrlWithDatabase(database),
        username: process.env.NEXT_PUBLIC_CLICKHOUSE_USER ?? 'htanwebuser',
        password: getClickhousePassword(),
        request_timeout: 600000,
        compression: {
            response: true,
            request: false,
        },
    });

    _clientsByDatabase.set(database, client);
    return client;
}

export function getPhase2Client(): WebClickHouseClient {
    const phase2Database =
        process.env.NEXT_PUBLIC_CLICKHOUSE_DB_PHASE2 ??
        DEFAULT_PHASE2_CLICKHOUSE_DB;
    return getClientForDatabase(phase2Database);
}

export function getCountsByTypeQueryUniformFilterString(filterString: string) {
    return {
        genderFilterString: filterString,
        raceFilterString: filterString,
        primaryDiagnosisFilterString: filterString,
        ethnicityFilterString: filterString,
        tissueOrOrganOfOriginFilterString: filterString,
        levelFilterString: filterString,
        assayNameFilterString: filterString,
        treatmentTypeFilterString: filterString,
        fileFormatFilterString: filterString,
        viewersFilterString: filterString,
        organTypeFilterString: filterString,
        atlasNameFilterString: filterString,
        downloadSourceFilterString: filterString,
        releaseVersionFilterString: filterString,
    };
}

export const defaultCountsByTypeQueryFilterString = getCountsByTypeQueryUniformFilterString(
    ''
);

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
        fileQueryForDownloadSource AS (SELECT viewersArr, * FROM files <%=downloadSourceFilterString%>),
        fileQueryForReleaseVersion AS (SELECT viewersArr, * FROM files <%=releaseVersionFilterString%>)
    SELECT val, type, fieldType, count(Distinct concat(DataFileID, synapseId)) as count FROM (
        SELECT DataFileID, synapseId, arrayJoin(Gender) as val, 'Gender' as type, 'array' as fieldType FROM fileQueryForGender
        UNION ALL
        SELECT DataFileID, synapseId, arrayJoin(Race) as val, 'Race' as type, 'array' as fieldType FROM fileQueryForRace
        UNION ALL
        SELECT DataFileID, synapseId, arrayJoin(PrimaryDiagnosis) as val, 'PrimaryDiagnosis' as type, 'array' as fieldType FROM fileQueryForPrimaryDiagnosis
        UNION ALL
        SELECT DataFileID, synapseId, arrayJoin(Ethnicity) as val, 'Ethnicity' as type, 'array' as fieldType FROM fileQueryForEthnicity
        UNION ALL
        SELECT DataFileID, synapseId, arrayJoin(TissueorOrganofOrigin) as val, 'TissueorOrganofOrigin' as type, 'array' as fieldType FROM fileQueryForTissueOrOrganOfOrigin
        UNION ALL
        SELECT DataFileID, synapseId, level as val, 'level' as typ, 'string' as fieldType FROM fileQueryForLevel
        UNION ALL
        SELECT DataFileID, synapseId, assayName as val, 'assayName' as type, 'string' as fieldType FROM fileQueryForAssayName
        UNION ALL
        SELECT DataFileID, synapseId, arrayJoin(TreatmentType) as val, 'TreatmentType' as type, 'array' as fieldType FROM fileQueryForTreatmentType
        UNION ALL
        SELECT DataFileID, synapseId, FileFormat as val, 'FileFormat' as type, 'string' as fieldType FROM fileQueryForFileFormat
        UNION ALL
        SELECT DataFileID, synapseId, arrayJoin(viewersArr) as val, 'viewersArr' as type, 'array' as fieldType FROM fileQueryForViewers
        UNION ALL
        SELECT DataFileID, synapseId, arrayJoin(organType) as val, 'organType' as type, 'array' as fieldType FROM fileQueryForOrganType
        UNION ALL
        SELECT DataFileID, synapseId, atlas_name as val, 'AtlasName' as type, 'string' as fieldType FROM fileQueryForAtlasName
        UNION ALL
        SELECT DataFileID, synapseId, downloadSource as val, 'downloadSource' as type, 'string' as fieldType FROM fileQueryForDownloadSource
        UNION ALL
        SELECT DataFileID, synapseId, releaseVersion as val, 'releaseVersion' as type, 'string' as fieldType FROM fileQueryForReleaseVersion
    )
    WHERE notEmpty(val)                                                                 
    GROUP BY val, type, fieldType
`);

export async function doQuery<T>(
    str: any,
    client?: WebClickHouseClient
): Promise<T[]> {
    const resolvedClient = client ?? getDefaultClient();
    const resultSet = await resolvedClient.query({
        query: str,
        format: 'JSONEachRow',
    });

    return await resultSet.json();
}

export const fileQuery = `
    SELECT
        synapseId,
        atlasid,
        atlas_name,
        level,
        assayName,
        Filename,
        FileFormat,
        DataFileID,
        ParentDataFileID,
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
        downloadSource,
        releaseVersion,
        imageChannelMetadata,
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

export const caseQuery = _.template(`
    SELECT * FROM cases
    WHERE ParticipantID IN (
        SELECT demographicsIds FROM files 
        ARRAY JOIN demographicsIds
        <%=filterString%>
        UNION DISTINCT 
        SELECT diagnosisIds FROM files
        ARRAY JOIN diagnosisIds
        <%=filterString%>
    )
`);

export const specimenQuery = _.template(`
    SELECT * FROM specimen
    WHERE specimen.BiospecimenID IN (
        SELECT biospecimenIds FROM files
        ARRAY JOIN biospecimenIds
        <%=filterString%>
    )
`);

export const fileQuery2 = `
    SELECT
        synapseId,
        atlasid,
        atlas_name,
        level,
        assayName,
        Filename,
        FileFormat,
        HTAN_DATA_FILE_ID,
        HTAN_PARENT_ID,
        ParentDataFileID,
        biospecimenIds,
        SEX,
        ETHNIC_GROUP,
        RACE,
        VITAL_STATUS,
        TREATMENT_TYPE,
        PRIMARY_DIAGNOSIS_NCI_THESAURUS_ID,
        TISSUE_OR_ORGAN_OF_ORIGIN_UBERON_CODE,
        TISSUE_OR_ORGAN_OF_ORIGIN_UBERON_NAME,
        CAST([] AS Array(String)) AS viewersArr,
        CAST([] AS Array(String)) AS organType,
        CAST([] AS Array(String)) AS publicationIds,
        diagnosisIds,
        demographicsIds,
        therapyIds,
        Component
    FROM files
`;

export const caseQuery2 = _.template(`
    SELECT * FROM cases
    WHERE HTAN_PARTICIPANT_ID IN (
        SELECT demographicsIds FROM files
        ARRAY JOIN demographicsIds
        <%=filterString%>
        UNION DISTINCT
        SELECT diagnosisIds FROM files
        ARRAY JOIN diagnosisIds
        <%=filterString%>
    )
`);

export const specimenQuery2 = _.template(`
    SELECT * FROM specimen
    WHERE HTAN_BIOSPECIMEN_ID IN (
        SELECT biospecimenIds FROM files
        ARRAY JOIN biospecimenIds
        <%=filterString%>
    )
`);

export const countsByTypeQuery2 = _.template(`
    WITH
        fileQueryForSex AS (SELECT * FROM files <%=genderFilterString%>),
        fileQueryForRace AS (SELECT * FROM files <%=raceFilterString%>),
        fileQueryForPrimaryDiagnosis AS (SELECT * FROM files <%=primaryDiagnosisFilterString%>),
        fileQueryForEthnicity AS (SELECT * FROM files <%=ethnicityFilterString%>),
        fileQueryForTissueOrOrganOfOrigin AS (SELECT * FROM files <%=tissueOrOrganOfOriginFilterString%>),
        fileQueryForLevel AS (SELECT * FROM files <%=levelFilterString%>),
        fileQueryForAssayName AS (SELECT * FROM files <%=assayNameFilterString%>),
        fileQueryForTreatmentType AS (SELECT * FROM files <%=treatmentTypeFilterString%>),
        fileQueryForFileFormat AS (SELECT * FROM files <%=fileFormatFilterString%>),
        fileQueryForAtlasName AS (SELECT * FROM files <%=atlasNameFilterString%>)
    SELECT val, type, fieldType, count(Distinct HTAN_DATA_FILE_ID) as count FROM (
        SELECT HTAN_DATA_FILE_ID, synapseId, arrayJoin(SEX) as val, 'SEX' as type, 'array' as fieldType FROM fileQueryForSex
        UNION ALL
        SELECT HTAN_DATA_FILE_ID, synapseId, arrayJoin(RACE) as val, 'RACE' as type, 'array' as fieldType FROM fileQueryForRace
        UNION ALL
        SELECT HTAN_DATA_FILE_ID, synapseId, arrayJoin(PRIMARY_DIAGNOSIS_NCI_THESAURUS_ID) as val, 'PRIMARY_DIAGNOSIS_NCI_THESAURUS_ID' as type, 'array' as fieldType FROM fileQueryForPrimaryDiagnosis
        UNION ALL
        SELECT HTAN_DATA_FILE_ID, synapseId, arrayJoin(ETHNIC_GROUP) as val, 'ETHNIC_GROUP' as type, 'array' as fieldType FROM fileQueryForEthnicity
        UNION ALL
        SELECT HTAN_DATA_FILE_ID, synapseId, arrayJoin(TISSUE_OR_ORGAN_OF_ORIGIN_UBERON_CODE) as val, 'TISSUE_OR_ORGAN_OF_ORIGIN_UBERON_CODE' as type, 'array' as fieldType FROM fileQueryForTissueOrOrganOfOrigin
        UNION ALL
        SELECT HTAN_DATA_FILE_ID, synapseId, level as val, 'level' as type, 'string' as fieldType FROM fileQueryForLevel
        UNION ALL
        SELECT HTAN_DATA_FILE_ID, synapseId, assayName as val, 'assayName' as type, 'string' as fieldType FROM fileQueryForAssayName
        UNION ALL
        SELECT HTAN_DATA_FILE_ID, synapseId, arrayJoin(TREATMENT_TYPE) as val, 'TREATMENT_TYPE' as type, 'array' as fieldType FROM fileQueryForTreatmentType
        UNION ALL
        SELECT HTAN_DATA_FILE_ID, synapseId, FileFormat as val, 'FileFormat' as type, 'string' as fieldType FROM fileQueryForFileFormat
        UNION ALL
        SELECT HTAN_DATA_FILE_ID, synapseId, atlas_name as val, 'AtlasName' as type, 'string' as fieldType FROM fileQueryForAtlasName
    )
    WHERE notEmpty(val)
    GROUP BY val, type, fieldType
`);

export const assayQuery = _.template(`
    SELECT * FROM files WHERE has(files.publicationIds,'<%=publicationId %>')
`);

export const plotQuery = _.template(`
    SELECT <%=field%> as label, count(<%=field%>) as count FROM <%=table%> c
    WHERE c.ParticipantID IN (
        SELECT ids FROM files
        ARRAY JOIN demographicsIds as ids
        <%=filterString%>
    )
    GROUP BY <%=field%>
`);

export const assayPlotQuery = _.template(`
    SELECT assayName as label, count(DISTINCT demographic_id) as count FROM (
        SELECT demographic_id, assayName
        FROM files
        ARRAY JOIN demographicsIds AS demographic_id
        <%=filterString%>
    )
    GROUP BY assayName
`);

export function getFilterString(
    selectedFilters: SelectedFilter[],
    unfilteredOptions?: CountByType[]
) {
    const filterToFieldMap: { [filter: string]: string } = {
        AtlasName: 'atlas_name',
    };

    if (selectedFilters.length > 0) {
        const clauses = _(selectedFilters)
            .groupBy('group')
            .map((val, k) => {
                const field = filterToFieldMap[k] || k;
                // if any of the values are type string, we can assume they all are
                const values = val.map((v) => `'${v.value}'`).join(',');
                if (
                    val.find((v) => {
                        const option = unfilteredOptions?.find(
                            (o) => o.val === v.value
                        );
                        return option?.fieldType === 'string';
                    })
                ) {
                    return `${field} in (${values})`;
                } else {
                    return `hasAny(${field},[${values}])`;
                }
            })
            .value();

        return ' WHERE ' + clauses.join(' AND ');
    } else {
        return '';
    }
}

export function getFilterString2(
    selectedFilters: SelectedFilter[],
    unfilteredOptions?: CountByType[]
) {
    const filterToFieldMap: { [filter: string]: string } = {
        AtlasName: 'atlas_name',
        Gender: 'SEX',
        SEX: 'SEX',
        Ethnicity: 'ETHNIC_GROUP',
        ETHNIC_GROUP: 'ETHNIC_GROUP',
        Race: 'RACE',
        RACE: 'RACE',
        VitalStatus: 'VITAL_STATUS',
        VITAL_STATUS: 'VITAL_STATUS',
        TreatmentType: 'TREATMENT_TYPE',
        TREATMENT_TYPE: 'TREATMENT_TYPE',
        PrimaryDiagnosis: 'PRIMARY_DIAGNOSIS_NCI_THESAURUS_ID',
        PRIMARY_DIAGNOSIS_NCI_THESAURUS_ID:
            'PRIMARY_DIAGNOSIS_NCI_THESAURUS_ID',
        TissueorOrganofOrigin: 'TISSUE_OR_ORGAN_OF_ORIGIN_UBERON_CODE',
        TISSUE_OR_ORGAN_OF_ORIGIN_UBERON_CODE:
            'TISSUE_OR_ORGAN_OF_ORIGIN_UBERON_CODE',
    };

    if (selectedFilters.length > 0) {
        const clauses = _(selectedFilters)
            .groupBy('group')
            .map((val, k) => {
                const field = filterToFieldMap[k] || k;
                const values = val.map((v) => `'${v.value}'`).join(',');
                if (
                    val.find((v) => {
                        const option = unfilteredOptions?.find(
                            (o) => o.val === v.value && o.type === k
                        );
                        return option?.fieldType === 'string';
                    })
                ) {
                    return `${field} in (${values})`;
                } else {
                    return `hasAny(${field},[${values}])`;
                }
            })
            .value();

        return ' WHERE ' + clauses.join(' AND ');
    } else {
        return '';
    }
}
