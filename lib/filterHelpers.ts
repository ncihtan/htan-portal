import _ from 'lodash';

import { Entity, filterObject } from './helpers';
import {
    FileAttributeMap,
    ToolAttributeMap,
    ToolAttributeNames,
} from './types';
import { Tool } from './tools';

import {
    ISelectedFiltersByAttrName,
    SelectedFilter,
} from '../packages/data-portal-filter/src/libs/types';
import {
    filterEntities,
    groupEntitiesByAttrNameAndValue,
} from '../packages/data-portal-filter/src/libs/helpers';
import { AttributeNames } from '../packages/data-portal-utils/src/libs/types';

export interface IFilterControlsProps<T> {
    setFilter: (actionMeta: any) => void;
    selectedFiltersByGroupName: ISelectedFiltersByAttrName;
    selectedFilters: SelectedFilter[];
    entities: T[];
    groupsByProperty: { [attrName: string]: { [attrValue: string]: T[] } };
}

export function getFileFilterDisplayName(filter: string) {
    return FileAttributeMap[
        AttributeNames[filter as keyof typeof AttributeNames]
    ].displayName;
}

export function getToolFilterDisplayName(filter: string) {
    return ToolAttributeMap[
        ToolAttributeNames[filter as keyof typeof ToolAttributeNames]
    ].displayName;
}

export function groupFilesByAttrNameAndValue(files: Entity[]) {
    return groupEntitiesByAttrNameAndValue(files, FileAttributeMap);
}

export function groupToolsByAttrNameAndValue(tools: Tool[]) {
    return groupEntitiesByAttrNameAndValue(tools, ToolAttributeMap);
}

export function filterFiles(
    filterSelectionsByAttrName: ISelectedFiltersByAttrName,
    files: Entity[]
) {
    return filterEntities(FileAttributeMap, filterSelectionsByAttrName, files);
}

export function filtertools(
    filterSelectionsByAttrName: ISelectedFiltersByAttrName,
    tools: Tool[]
) {
    return filterEntities(ToolAttributeMap, filterSelectionsByAttrName, tools);
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
