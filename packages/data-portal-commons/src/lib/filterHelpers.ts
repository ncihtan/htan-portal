import _ from 'lodash';
import {
    filterEntities,
    groupEntitiesByAttrNameAndValue,
    ISelectedFiltersByAttrName,
} from '@htan/data-portal-filter';
import { AttributeNames } from '@htan/data-portal-utils';
import { Entity } from './entity';
import { FileAttributeMap } from './types';

export function filterObject(
    object: any,
    filter: (val: any, key: any) => boolean
) {
    const filteredObj: any = {};
    _.forEach(object, (val, key) => {
        if (filter(val, key)) {
            filteredObj[key] = val;
        }
    });
    return filteredObj;
}

export function groupFilesByAttrNameAndValue(files: Entity[]) {
    return groupEntitiesByAttrNameAndValue(files, FileAttributeMap);
}

export function getFileFilterDisplayName(filter: string) {
    return FileAttributeMap[
        AttributeNames[filter as keyof typeof AttributeNames]
    ].displayName;
}

export function filterFiles(
    filterSelectionsByAttrName: ISelectedFiltersByAttrName,
    files: Entity[]
) {
    return filterEntities(FileAttributeMap, filterSelectionsByAttrName, files);
}

export function getFilteredCases(
    filteredFiles: Entity[],
    selectedFiltersByAttrName: ISelectedFiltersByAttrName,
    showAllCases: boolean
) {
    const cases = _.chain(filteredFiles)
        .flatMapDeep((f: Entity) => f.cases)
        .uniqBy((f) => f.ParticipantID)
        .value();

    if (showAllCases) {
        return cases;
    } else {
        const caseFilters = filterObject(
            selectedFiltersByAttrName,
            (filters, attrName) =>
                !!FileAttributeMap[attrName as AttributeNames].caseFilter
        );
        return filterFiles(caseFilters, cases);
    }
}

export function getFilteredSamples(
    filteredFiles: Entity[],
    filteredCases: Entity[],
    showAllSamples: boolean
) {
    const samples = _.chain(filteredFiles)
        .flatMapDeep((file) => file.biospecimen)
        .uniqBy((f) => f.BiospecimenID)
        .value();

    if (showAllSamples) {
        return samples;
    } else {
        const filteredCaseIds = _.keyBy(filteredCases, (c) => c.ParticipantID);
        return samples.filter((s) => {
            return s.ParticipantID in filteredCaseIds;
        });
    }
}
