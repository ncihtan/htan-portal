import _ from 'lodash';
import { AttributeNames } from '../../../data-portal-utils/src/libs/types';

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
            attributeName: AttributeNames.TissueorOrganofOrigin,
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

    return summary.map((s) => ({
        displayName: s.displayName,
        values: getSummaryData(
            s.attributeName,
            s.entities,
            groupsByPropertyFiltered
        ),
    }));
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
