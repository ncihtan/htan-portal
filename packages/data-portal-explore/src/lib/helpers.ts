import _ from 'lodash';
import { AttributeNames } from '@htan/data-portal-utils';
import { Entity, NOT_REPORTED } from '@htan/data-portal-commons';

export function getDefaultSummaryData<T>(
    filteredCases: T[],
    filteredSamples: T[],
    filteredFiles: T[],
    groupsByPropertyFiltered?: {
        [attrName: string]: { [attrValue: string]: T[] };
    }
) {
    const summary = [
        {
            displayName: 'Atlas',
            attributeName: AttributeNames.AtlasName,
        },
        {
            displayName: 'Organ',
            attributeName: AttributeNames.organType,
        },
        {
            displayName: 'Cancer Type',
            attributeName: AttributeNames.PrimaryDiagnosis,
        },
        {
            displayName: 'Case',
            entities: filteredCases,
        },
        {
            displayName: 'Biospecimen',
            entities: filteredSamples,
        },
        {
            displayName: 'Assay',
            attributeName: AttributeNames.assayName,
        },
        {
            displayName: 'File',
            entities: filteredFiles,
        },
    ];

    return summary.map((s) => {
        let values = getSummaryData(
            s.attributeName,
            s.entities,
            groupsByPropertyFiltered
        );

        // special case ORGAN: remove NOT_REPORTED from the values
        if (s.attributeName === AttributeNames.organType) {
            values = values.filter((v) => v !== NOT_REPORTED);
        }

        return {
            displayName: s.displayName,
            values,
        };
    });
}

export function getSummaryData<T>(
    attributeName?: string,
    entities?: T[],
    groupsByPropertyFiltered?: {
        [attrName: string]: { [attrValue: string]: T[] };
    }
): any[] {
    if (entities) {
        return entities;
    } else if (attributeName && groupsByPropertyFiltered) {
        return _.keys(groupsByPropertyFiltered[attributeName]);
    } else {
        return [];
    }
}

export function doesFileIncludeLevel1OrLevel2SequencingData(file: Entity) {
    return (
        !file.Component.startsWith('Imaging') &&
        (file.level === 'Level 1' || file.level === 'Level 2')
    );
}
