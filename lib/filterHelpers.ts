import _ from 'lodash';

import { Entity } from './helpers';
import {
    AttributeMap,
    AttributeNames,
    ExploreOptionType,
    IAttributeInfo,
    IFilterValuesSetByGroupName,
} from './types';

function getAttrValueFromFile(file: Entity, attrInfo: IAttributeInfo) {
    let attrValue: string | string[] | undefined;

    if (attrInfo.path) {
        attrValue = _.at<any>(file, attrInfo.path)[0];
    } else if (attrInfo.getValues) {
        attrValue = attrInfo.getValues(file).filter((x) => !!x);
    }

    if (_.isArray(attrValue) && attrValue.length === 0) {
        // no values => undefined
        attrValue = undefined;
    }

    return attrValue;
}

export function groupsByAttrValue(files: Entity[]) {
    const ret: {
        [attrName: string]: {
            [attrValue: string]: Entity[];
        };
    } = {};

    _.forEach(AttributeMap, (attrInfo, attrName) => {
        ret[attrName] = _.omit(
            _.groupBy(files, (file: Entity) => {
                return getAttrValueFromFile(file, attrInfo);
            }),
            'undefined'
        );
    });

    return ret;
}

export function filterFiles(
    filterValuesByGroupName: IFilterValuesSetByGroupName,
    files: Entity[]
) {
    // If there are any filters...
    if (_.size(filterValuesByGroupName)) {
        //...find the files where the passed filters match
        return files.filter((f) => {
            return _.every(
                filterValuesByGroupName,
                (filterValueSet, groupName) => {
                    const attrValue = getAttrValueFromFile(
                        f,
                        AttributeMap[groupName as AttributeNames]
                    );
                    // If the file has a value relating to this filter group...
                    if (attrValue) {
                        // ...check if the file's value is one of the filter selections

                        if (_.isArray(attrValue)) {
                            // If the file has multiple values, check each of them
                            return _.some(attrValue, (v) =>
                                filterValueSet.has(v)
                            );
                        } else {
                            return filterValueSet.has(attrValue);
                        }
                    }
                    //...otherwise, return false
                    return false;
                }
            );
        });
    } else {
        return files;
    }
}

export function makeOptions(
    attrName: AttributeNames,
    filterValuesByGroupName: IFilterValuesSetByGroupName,
    files: Entity[],
    getGroupsByProperty: any
): ExploreOptionType[] {
    const filteredFilesMinusOption = groupsByAttrValue(
        filterFiles(_.omit(filterValuesByGroupName, [attrName]), files)
    )[attrName];

    return _.map(getGroupsByProperty[attrName], (val, key) => {
        const count =
            key in filteredFilesMinusOption
                ? filteredFilesMinusOption[key].length
                : 0;
        return {
            value: key,
            label: key,
            group: attrName,
            count,
        };
    });
}
