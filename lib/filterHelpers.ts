import _ from 'lodash';

import { Entity, filterObject } from './helpers';
import {
    FileAttributeMap,
    AttributeNames,
    ExploreOptionType,
    ExploreSelectedFilter,
    IAttributeInfo,
    ISelectedFiltersByAttrName,
    FilterAction,
    ExploreActionMeta,
    ToolAttributeMap,
    ToolAttributeNames,
} from './types';
import { Tool } from './tools';

export interface IFilterControlsProps<T> {
    setFilter: (actionMeta: any) => void;
    selectedFiltersByGroupName: ISelectedFiltersByAttrName;
    selectedFilters: ExploreSelectedFilter[];
    entities: T[];
    groupsByProperty: { [attrName: string]: { [attrValue: string]: T[] } };
}

export function getSelectedFiltersByAttrName(
    selectedFilters: ExploreSelectedFilter[]
): ISelectedFiltersByAttrName {
    return _.chain(selectedFilters)
        .groupBy((item) => item.group)
        .mapValues((filters: ExploreSelectedFilter[]) => {
            return new Set(filters.map((f) => f.value));
        })
        .value();
}

export function getNewFilters(
    selectedFilters: ExploreSelectedFilter[],
    actionMeta: ExploreActionMeta<ExploreSelectedFilter>
): ExploreSelectedFilter[] {
    let newFilters: ExploreSelectedFilter[] = selectedFilters;
    switch (actionMeta.action) {
        case FilterAction.CLEAR_ALL:
            // Deselect all filters
            newFilters = [];
            break;
        case FilterAction.CLEAR:
            if (actionMeta.option) {
                // Deselect all options for the given group
                newFilters = selectedFilters.filter((o) => {
                    return o.group !== actionMeta.option!.group;
                });
            }
            break;
        case FilterAction.SELECT:
        case FilterAction.DESELECT:
            if (actionMeta.option) {
                // first remove the item
                newFilters = selectedFilters.filter((o) => {
                    return (
                        o.group !== actionMeta.option!.group! ||
                        o.value !== actionMeta.option!.value!
                    );
                });
                if (actionMeta.action === 'select-option') {
                    // Add it back if selecting
                    const option = actionMeta.option;
                    newFilters = newFilters.concat([option]);
                }
            }
            break;
    }

    return newFilters;
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

function getAttrValueFromEntity<Attribute extends string, T>(
    attributeMap: { [attr in Attribute]: IAttributeInfo<T> },
    entity: T,
    attrName: Attribute
) {
    const attrInfo = attributeMap[attrName];
    let attrValue: string | string[] | undefined;

    if (attrInfo.path) {
        attrValue = _.at<any>(entity, attrInfo.path)[0];
    } else if (attrInfo.getValues) {
        attrValue = attrInfo.getValues(entity).filter((x) => !!x);
    }

    if (_.isArray(attrValue) && attrValue.length === 0) {
        // no values => undefined
        attrValue = undefined;
    }

    return attrValue;
}

export function groupFilesByAttrNameAndValue(files: Entity[]) {
    return groupEntitiesByAttrNameAndValue(files, FileAttributeMap);
}

export function groupToolsByAttrNameAndValue(tools: Tool[]) {
    return groupEntitiesByAttrNameAndValue(tools, ToolAttributeMap);
}

export function groupEntitiesByAttrNameAndValue<Attribute extends string, T>(
    entities: T[],
    attributeMap: { [attr in Attribute]: IAttributeInfo<T> }
): { [attrName: string]: { [attrValue: string]: T[] } } {
    const ret: {
        [attrName: string]: {
            [attrValue: string]: T[];
        };
    } = {};

    function addEntityToGroup(
        entity: T,
        groupedByValue: { [attrValue: string]: T[] },
        attrVal: string
    ) {
        if (!groupedByValue[attrVal]) {
            groupedByValue[attrVal] = [];
        }
        groupedByValue[attrVal].push(entity);
    }

    _.forEach(attributeMap, (attrInfo, attrName) => {
        const groupedByValue = {};
        for (const entity of entities) {
            const attrVals = getAttrValueFromEntity(
                attributeMap,
                entity,
                attrName
            );
            if (attrVals) {
                if (_.isArray(attrVals)) {
                    for (const val of attrVals) {
                        addEntityToGroup(entity, groupedByValue, val);
                    }
                } else {
                    addEntityToGroup(entity, groupedByValue, attrVals);
                }
            }
        }
        ret[attrName] = groupedByValue;
    });

    return ret;
}

function doesEntityPassFilter<Attribute extends string, T>(
    attributeMap: { [attr in Attribute]: IAttributeInfo<T> },
    entity: T,
    filterSelectionsByAttrName: ISelectedFiltersByAttrName
) {
    return _.every(filterSelectionsByAttrName, (filterValueSet, attrName) => {
        const attrValue = getAttrValueFromEntity(
            attributeMap,
            entity,
            attrName
        );
        // If the file has a value relating to this filter group...
        if (attrValue) {
            // ...check if the file's value is one of the filter selections
            if (_.isArray(attrValue)) {
                // If the file has multiple values, check each of them
                return _.some(attrValue, (v) => filterValueSet.has(v));
            } else {
                return filterValueSet.has(attrValue);
            }
        }
        //...otherwise, return false
        return false;
    });
}

export function filterEntities<Attribute extends string, T>(
    attributeMap: { [attr in Attribute]: IAttributeInfo<T> },
    filterSelectionsByAttrName: ISelectedFiltersByAttrName,
    entities: T[]
) {
    // If there are any filters...
    if (_.size(filterSelectionsByAttrName)) {
        //...find the files where the passed filters match
        return entities.filter((e) => {
            return doesEntityPassFilter(
                attributeMap,
                e,
                filterSelectionsByAttrName
            );
        });
    } else {
        return entities;
    }
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

export function countFilteredEntitiesByAttrValue<Attribute extends string, T>(
    attributeMap: { [attr in Attribute]: IAttributeInfo<T> },
    filterSelectionsByAttrName: ISelectedFiltersByAttrName,
    entities: T[],
    attrName: string
) {
    const counts: { [attrValue: string]: number } = {};

    function addOne(attrVal: string) {
        if (!(attrVal in counts)) {
            counts[attrVal] = 0;
        }
        counts[attrVal] += 1;
    }

    entities.forEach((entity) => {
        if (
            !doesEntityPassFilter(
                attributeMap,
                entity,
                filterSelectionsByAttrName
            )
        ) {
            // skip if file doesnt pass filter
            return;
        }
        const attrVal = getAttrValueFromEntity(attributeMap, entity, attrName);
        if (!attrVal) {
            // skip if no value
            return;
        }
        if (_.isArray(attrVal)) {
            // multiple values - add 1 for each
            for (const val of attrVal) {
                addOne(val);
            }
        } else {
            addOne(attrVal);
        }
    });

    return counts;
}

export function makeOptions<Attribute extends string, T>(
    attrName: Attribute,
    attributeMap: { [attr in Attribute]: IAttributeInfo<T> },
    selectedFiltersByAttrName: ISelectedFiltersByAttrName,
    entities: T[],
    entitiesByProperty: { [attrName: string]: { [attrValue: string]: T[] } }
): ExploreOptionType[] {
    const filtersWithoutThisAttr = _.omit(selectedFiltersByAttrName, [
        attrName,
    ]);
    const counts = countFilteredEntitiesByAttrValue(
        attributeMap,
        filtersWithoutThisAttr,
        entities,
        attrName
    );

    return _.map(entitiesByProperty[attrName], (val, key) => {
        return {
            value: key,
            label: key,
            group: attrName,
            count: counts[key] || 0,
        };
    });
}

export function getOptions<Attribute extends string, T>(
    attributeMap: { [attr in Attribute]: IAttributeInfo<T> },
    selectedFiltersByGroupName: ISelectedFiltersByAttrName,
    selectedFilters: ExploreSelectedFilter[],
    entities: T[],
    groupsByProperty: { [attrName: string]: { [attrValue: string]: T[] } }
): (attrName: Attribute) => ExploreOptionType[] {
    const isOptionSelected = (option: ExploreSelectedFilter) => {
        return (
            _.find(selectedFilters, (o: ExploreSelectedFilter) => {
                return o.value === option.value && option.group === o.group;
            }) !== undefined
        );
    };

    return (attrName: Attribute): ExploreOptionType[] => {
        const ret = makeOptions(
            attrName,
            attributeMap,
            selectedFiltersByGroupName,
            entities,
            groupsByProperty
        );
        ret.forEach((opt) => {
            opt.group = attrName;
            opt.isSelected = isOptionSelected(opt); // this call has to happen after setting `group`
        });
        return _.sortBy(ret, (o) => o.label);
    };
}

export function getSelectOptions<Attribute extends string, T>(
    attributeMap: { [attr in Attribute]: IAttributeInfo<T> },
    attributeNames: Attribute[],
    options: (attrName: Attribute) => ExploreOptionType[]
): { label: string; options: ExploreOptionType[] }[] {
    return attributeNames.map((attrName) => {
        return {
            label: attributeMap[attrName].displayName,
            options: options(attrName),
        };
    });
}

export function getFilteredCases(
    filteredFiles: Entity[],
    selectedFiltersByAttrName: ISelectedFiltersByAttrName,
    showAllCases: boolean
) {
    const cases = _.chain(filteredFiles)
        .flatMapDeep((f: Entity) => f.cases)
        .uniqBy((f) => f.HTANParticipantID)
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
        .uniqBy((f) => f.HTANBiospecimenID)
        .value();

    if (showAllSamples) {
        return samples;
    } else {
        const filteredCaseIds = _.keyBy(
            filteredCases,
            (c) => c.HTANParticipantID
        );
        return samples.filter((s) => {
            return s.HTANParticipantID in filteredCaseIds;
        });
    }
}
