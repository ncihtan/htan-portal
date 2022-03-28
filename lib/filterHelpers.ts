import _ from 'lodash';

import { Entity, filterObject } from './helpers';
import {
    AttributeMap,
    AttributeNames,
    ExploreOptionType,
    ISelectedFiltersByAttrName,
} from './types';

function getAttrValueFromFile(file: Entity, attrName: AttributeNames) {
    const attrInfo = AttributeMap[attrName];
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

export function groupFilesByAttrNameAndValue(files: Entity[]) {
    const ret: {
        [attrName: string]: {
            [attrValue: string]: Entity[];
        };
    } = {};

    function addFileToGroup(
        file: Entity,
        groupedByValue: { [attrValue: string]: Entity[] },
        attrVal: string
    ) {
        if (!groupedByValue[attrVal]) {
            groupedByValue[attrVal] = [];
        }
        groupedByValue[attrVal].push(file);
    }

    _.forEach(AttributeMap, (attrInfo, attrName) => {
        const groupedByValue = {};
        for (const file of files) {
            const attrVals = getAttrValueFromFile(
                file,
                attrName as AttributeNames
            );
            if (attrVals) {
                if (_.isArray(attrVals)) {
                    for (const val of attrVals) {
                        addFileToGroup(file, groupedByValue, val);
                    }
                } else {
                    addFileToGroup(file, groupedByValue, attrVals);
                }
            }
        }
        ret[attrName] = groupedByValue;
    });

    return ret;
}

function doesFilePassFilter(
    file: Entity,
    filterSelectionsByAttrName: ISelectedFiltersByAttrName
) {
    return _.every(filterSelectionsByAttrName, (filterValueSet, attrName) => {
        const attrValue = getAttrValueFromFile(
            file,
            attrName as AttributeNames
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

export function filterFiles(
    filterSelectionsByAttrName: ISelectedFiltersByAttrName,
    files: Entity[]
) {
    // If there are any filters...
    if (_.size(filterSelectionsByAttrName)) {
        //...find the files where the passed filters match
        return files.filter((f) => {
            return doesFilePassFilter(f, filterSelectionsByAttrName);
        });
    } else {
        return files;
    }
}

export function countFilteredFilesByAttrValue(
    filterSelectionsByAttrName: ISelectedFiltersByAttrName,
    files: Entity[],
    attrName: string
) {
    const counts: { [attrValue: string]: number } = {};

    function addOne(attrVal: string) {
        if (!(attrVal in counts)) {
            counts[attrVal] = 0;
        }
        counts[attrVal] += 1;
    }

    files.forEach((file) => {
        if (!doesFilePassFilter(file, filterSelectionsByAttrName)) {
            // skip if file doesnt pass filter
            return;
        }
        const attrVal = getAttrValueFromFile(file, attrName as AttributeNames);
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

export function makeOptions(
    attrName: AttributeNames,
    selectedFiltersByAttrName: ISelectedFiltersByAttrName,
    files: Entity[],
    filesByProperty: { [attrName: string]: { [attrValue: string]: Entity[] } }
): ExploreOptionType[] {
    const filtersWithoutThisAttr = _.omit(selectedFiltersByAttrName, [
        attrName,
    ]);
    const counts = countFilteredFilesByAttrValue(
        filtersWithoutThisAttr,
        files,
        attrName
    );

    return _.map(filesByProperty[attrName], (val, key) => {
        return {
            value: key,
            label: key,
            group: attrName,
            count: counts[key] || 0,
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
                !!AttributeMap[attrName as AttributeNames].caseFilter
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
