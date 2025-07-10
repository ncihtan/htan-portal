import _ from 'lodash';
import { createClient } from '@clickhouse/client-web';
import { WebClickHouseClient } from '@clickhouse/client-web/dist/client';
import { SelectedFilter } from '@htan/data-portal-filter';

import { CountByType } from './types';

const defaultClient: WebClickHouseClient = createClient({
    url: 'https://mecgt250i0.us-east-1.aws.clickhouse.cloud:8443/htan',
    username: 'webuser',
    password: 'My_password1976',
    request_timeout: 600000,
    compression: {
        response: true,
        request: false,
    },
});

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
    client: WebClickHouseClient = defaultClient
): Promise<T[]> {
    const resultSet = await client.query({
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
