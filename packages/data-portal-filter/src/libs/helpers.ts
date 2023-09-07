import _ from 'lodash';

import { IAttributeInfo } from '../../../data-portal-utils/src/libs/types';

import {
    SelectedFilter,
    ISelectedFiltersByAttrName,
    FilterActionMeta,
    FilterAction,
    OptionType,
} from './types';

export function getSelectedFiltersByAttrName(
    selectedFilters: SelectedFilter[]
): ISelectedFiltersByAttrName {
    return _.chain(selectedFilters)
        .groupBy((item) => item.group)
        .mapValues((filters: SelectedFilter[]) => {
            return new Set(filters.map((f) => f.value));
        })
        .value();
}

export function getNewFilters(
    selectedFilters: SelectedFilter[],
    actionMeta: FilterActionMeta<SelectedFilter>
): SelectedFilter[] {
    let newFilters: SelectedFilter[] = selectedFilters;
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
): OptionType[] {
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
    selectedFilters: SelectedFilter[],
    entities: T[],
    groupsByProperty: { [attrName: string]: { [attrValue: string]: T[] } }
): (attrName: Attribute) => OptionType[] {
    const isOptionSelected = (option: SelectedFilter) => {
        return (
            _.find(selectedFilters, (o: SelectedFilter) => {
                return o.value === option.value && option.group === o.group;
            }) !== undefined
        );
    };

    return (attrName: Attribute): OptionType[] => {
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
    options: (attrName: Attribute) => OptionType[]
): { label: string; options: OptionType[] }[] {
    return attributeNames.map((attrName) => {
        return {
            label: attributeMap[attrName].displayName,
            options: options(attrName),
        };
    });
}
