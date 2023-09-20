import _ from 'lodash';
import { AttributeNames } from '../packages/data-portal-utils/src/libs/types';
import { Entity } from '../packages/data-portal-commons/src/libs/entity';

const organMapping: OrganMapping = require('../data/human-organ-mappings.json');

export type OrganMapping = {
    [organ: string]: {
        byPrimarySite: string[];
        byTissueOrOrganOfOrigin: string[];
    };
};

export type DistributionByAttribute = {
    attributeName: string;
    attributeValue: string;
    caseCount: number;
    // TODO adultCaseCount, pediatricCaseCount, etc.
};

export type EntityReportByAttribute = {
    attributeName: string;
    attributeValue?: string;
    totalCount: number;
    attributeFilterValues: string[]; // useful when attributeValue is normalized
    distributionByCenter: {
        attributeFilterValues: string[];
        center: string;
        totalCount: number;
        distributionByAdditionalAttribute?: DistributionByAttribute[];
    }[];
};

export type EntityReportByCenter = {
    center: string;
    distributionByAttribute: {
        attributeName: string;
        attributeValue?: string;
        attributeFilterValues: string[]; // useful when attributeValue is normalized
        totalCount: number;
        distributionByAdditionalAttribute?: DistributionByAttribute[];
    }[];
};

export function normalizeTissueOrOrganOrSite(value: string) {
    return value.toLowerCase().replace(/,/g, '');
}

function initTissueOrOrganOrSiteToOrganMap(
    organMapping: OrganMapping
): { [tissueOrOrganOrSite: string]: string } {
    const map: { [tissueOrOrganOrSite: string]: string } = {};

    _.forEach(
        organMapping,
        (
            value: {
                byPrimarySite: string[];
                byTissueOrOrganOfOrigin: string[];
            },
            organ: string
        ) => {
            value.byPrimarySite.forEach(
                (site) => (map[normalizeTissueOrOrganOrSite(site)] = organ)
            );
            value.byTissueOrOrganOfOrigin.forEach(
                (tissueOrOrgan) =>
                    (map[normalizeTissueOrOrganOrSite(tissueOrOrgan)] = organ)
            );
        }
    );

    return map;
}

const tissueOrOriginToOrganMap = initTissueOrOrganOrSiteToOrganMap(
    organMapping
);

export function computeEntityReportByAttribute(
    entities: Entity[],
    getAttributeValue: (entity: Entity) => string | undefined,
    getUniqByAttribute: (entity: Entity) => string,
    computeDistributionByCenter: (
        entities: Entity[]
    ) => EntityReportByAttribute | undefined
): EntityReportByAttribute[] {
    const entitiesByAttributeValue: { [value: string]: Entity[] } = {};

    for (const entity of entities) {
        // first we get value using the getter (which retrieves value of selected field)
        const value = getAttributeValue(entity);
        // if there is no value then we throw it away
        // we might want to introduce an N/A value here
        if (value) {
            // if there is a value then we push into a collection corresponding
            // to the key (e.g. "female" if field is gender)
            entitiesByAttributeValue[value] =
                entitiesByAttributeValue[value] || [];
            entitiesByAttributeValue[value].push(entity);
        }
    }

    // remove duplicates if any
    for (const value in entitiesByAttributeValue) {
        entitiesByAttributeValue[value] = _.uniqBy(
            entitiesByAttributeValue[value],
            getUniqByAttribute
        );
    }

    // convert to EntityReportByAttribute[]
    return _.compact(
        _.values(entitiesByAttributeValue).map(computeDistributionByCenter)
    );
}

export function getNormalizedOrgan(entity: Entity) {
    return (
        tissueOrOriginToOrganMap[
            normalizeTissueOrOrganOrSite(entity.TissueorOrganofOrigin)
        ] || entity.TissueorOrganofOrigin
    );
}

export function getNormalizedAssay(entity: Entity) {
    return entity.assayName;
}

export function computeEntityReportByAssay(
    files: Entity[]
): EntityReportByAttribute[] {
    return computeEntityReportByAttribute(
        files,
        getNormalizedAssay,
        (d) => d.DataFileID,
        computeAssayDistributionByCenter
    );
}

export function computeEntityReportByOrgan(
    files: Entity[]
): EntityReportByAttribute[] {
    return computeEntityReportByAttribute(
        _.flatten(files.map((file) => file.diagnosis)),
        getNormalizedOrgan,
        (d) => d.ParticipantID,
        computeOrganDistributionByCenter
    );
}

// TODO this function doesn't seem to be used anywhere
export function computeEntityReportGeneralized(
    entities: Entity[],
    field: string = 'TissueorOrganofOrigin',
    uniqByAttribute: (e: Entity) => string,
    counter: (entities: Entity[]) => number
): EntityReportByAttribute[] {
    const getAttributeValue = (entity: Entity) =>
        entity[field as keyof Entity] as string | undefined;

    const reports = computeEntityReportByAttribute(
        entities,
        getAttributeValue,
        uniqByAttribute,
        (entities) => {
            return {
                // assuming that attribute value is the same for all entities in the input list
                attributeValue: getAttributeValue(entities[0]),
                attributeName: field,
                attributeFilterValues: [],
                totalCount: counter(entities),
                distributionByCenter: [],
            };
        }
    );

    return reports;
}

export function entityReportByAttributeToByCenter(
    report: EntityReportByAttribute[]
): EntityReportByCenter[] {
    const distributionByAttribute: {
        [center: string]: {
            attributeName: string;
            attributeValue?: string;
            totalCount: number;
            attributeFilterValues: string[];
            distributionByAdditionalAttribute?: DistributionByAttribute[];
        }[];
    } = {};

    report.forEach((r) => {
        r.distributionByCenter.forEach((d) => {
            distributionByAttribute[d.center] =
                distributionByAttribute[d.center] || [];
            distributionByAttribute[d.center].push({
                attributeName: r.attributeName,
                attributeValue: r.attributeValue,
                attributeFilterValues: d.attributeFilterValues,
                totalCount: d.totalCount,
                distributionByAdditionalAttribute:
                    d.distributionByAdditionalAttribute,
            });
        });
    });

    return _.sortBy(
        _.entries(distributionByAttribute).map(
            ([center, distributionByAttribute]) => ({
                center,
                distributionByAttribute,
            })
        ),
        (d) => d.center
    );
}

export function computeDistributionByDisease(
    entities: Entity[]
): DistributionByAttribute[] {
    // assuming entities are diagnoses
    return _.entries(_.countBy(entities, (d) => d.PrimaryDiagnosis)).map(
        ([disease, caseCount]) => ({
            attributeName: AttributeNames.PrimaryDiagnosis,
            attributeValue: disease,
            caseCount,
        })
    );
}

export function computeAttributeValueDistributionByCenter(
    entitiesByAttributeValue: Entity[],
    getAttributeFilterValues: (entities: Entity[]) => string[],
    countEntities?: (entities: Entity[]) => number,
    computeDistributionByAdditionalAttribute?: (
        entities: Entity[]
    ) => DistributionByAttribute[]
) {
    const entitiesByAtlas = _.groupBy(
        entitiesByAttributeValue,
        (d) => d.atlas_name
    );

    return _.entries(entitiesByAtlas).map(([center, entities]) => {
        return {
            center,
            totalCount: countEntities
                ? countEntities(entities)
                : entities.length,
            attributeFilterValues: getAttributeFilterValues(entities),
            distributionByAdditionalAttribute: computeDistributionByAdditionalAttribute
                ? computeDistributionByAdditionalAttribute(entities)
                : undefined,
        };
    });
}

export function getOrganFilterValues(entities: Entity[]) {
    return _.uniq(entities.map((d) => d.TissueorOrganofOrigin));
}

export function getAssayFilterValues(entities: Entity[]) {
    return _.compact(_.uniq(entities.map((d) => d.assayName)));
}

export function computeAttributeDistributionByCenter(
    entities: Entity[],
    attributeName: string,
    getAttributeValue: (diagnosis: Entity) => string | undefined,
    getAttributeFilterValues: (diagnoses: Entity[]) => string[],
    countEntities?: (entities: Entity[]) => number,
    computeDistributionByAdditionalAttribute: (
        diagnoses: Entity[]
    ) => DistributionByAttribute[] = computeDistributionByDisease
) {
    if (entities.length > 0) {
        const distributionByCenter = computeAttributeValueDistributionByCenter(
            entities,
            getAttributeFilterValues,
            countEntities,
            computeDistributionByAdditionalAttribute
        );

        return {
            // assuming that attribute value is the same for all entities in the input list
            attributeValue: getAttributeValue(entities[0]),
            attributeName: attributeName,
            attributeFilterValues: _.uniq(
                _.flatten(
                    distributionByCenter.map((d) => d.attributeFilterValues)
                )
            ),
            totalCount: _.sumBy(distributionByCenter, (d) => d.totalCount),
            distributionByCenter,
        };
    } else {
        return undefined;
    }
}

export function computeOrganDistributionByCenter(
    diagnosesByOrgan: Entity[]
): EntityReportByAttribute | undefined {
    return computeAttributeDistributionByCenter(
        diagnosesByOrgan,
        AttributeNames.TissueorOrganofOrigin,
        getNormalizedOrgan,
        getOrganFilterValues,
        (entities) => entities.length,
        computeDistributionByDisease
    );
}

// TODO this function doesn't seem to be used anywhere
export function computeDistributionByCenterGeneralized(
    diagnoses: Entity[]
): EntityReportByAttribute | undefined {
    return computeAttributeDistributionByCenter(
        diagnoses,
        AttributeNames.PrimaryDiagnosis,
        getNormalizedOrgan,
        getOrganFilterValues,
        (entities) => entities.length,
        computeDistributionByDisease
    );
}

export function computeAssayDistributionByCenter(
    entitiesByAssays: Entity[]
): EntityReportByAttribute | undefined {
    return computeAttributeDistributionByCenter(
        entitiesByAssays,
        AttributeNames.assayName,
        getNormalizedAssay,
        getAssayFilterValues,
        // entities are files but we want to show total number of unique cases, not files
        (entities) =>
            _.uniq(_.flatten(entities.map((e) => e.diagnosisIds))).length,
        // TODO assay distribution by disease does not work since entities are files not diagnoses,
        //  we need to modify the function to support a list of files as well, or show another attribute for assays
        //  this distribution is only displayed when we show a stacked bar chart which is currently a hidden feature
        computeDistributionByDisease
    );
}

export function dataWithoutUnknownValues(data: EntityReportByAttribute[]) {
    return data.filter(
        (r) => r.attributeValue && r.attributeValue !== 'Not Reported'
    );
}

export function computeUniqueAttributeValueCount(
    data: EntityReportByAttribute[]
) {
    return _.uniq(dataWithoutUnknownValues(data).map((r) => r.attributeValue))
        .length;
}
