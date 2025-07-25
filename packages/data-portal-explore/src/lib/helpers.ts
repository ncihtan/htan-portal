import _ from 'lodash';
import { AttributeNames } from '@htan/data-portal-utils';
import { Entity, NOT_REPORTED } from '@htan/data-portal-commons';
import { GroupsByProperty } from '@htan/data-portal-filter';

export function getDefaultSummaryData<T>(
    filteredCases: T[],
    filteredSamples: T[],
    filteredFiles: T[],
    groupsByPropertyFiltered?: GroupsByProperty<T>,
    getOptionValue?: (val: any, key: string) => string
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
            groupsByPropertyFiltered,
            getOptionValue
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
    groupsByPropertyFiltered?: GroupsByProperty<T>,
    getOptionValue: (val: any, key: string) => string = (val, key) => key
): any[] {
    if (entities) {
        return entities;
    } else if (attributeName && groupsByPropertyFiltered) {
        return _.map(groupsByPropertyFiltered[attributeName], getOptionValue);
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
