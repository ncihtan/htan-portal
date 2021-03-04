import _ from "lodash";

import {Entity} from "./helpers";
import {ExploreOptionType, ExploreSelectedFilter, IFiltersByGroupName, PropMap, PropNames} from "./types";

export function groupsByProperty(files: Entity[]) {
    const m: any = {};

    _.forEach(PropMap, (o, k) => {
        m[k] = _.groupBy(files, (f) => {
            //@ts-ignore
            const val = _.at(f, [o.prop]);
            return val ? val[0] : 'other';
        });
    });

    return m;
}

export function filterFiles(
    filters: { [key: string]: ExploreSelectedFilter[] },
    files: Entity[]
) {
    if (_.size(filters)) {
        // find the files where the passed filters match
        return files.filter((f) => {
            return _.every(filters, (filter, name) => {
                //@ts-ignore
                const val = _.at(f, PropMap[name].prop);
                //@ts-ignore
                return val ? filter.map((f)=>f.value).includes(val[0]) : false;
            });
        });
    } else {
        return files;
    }
}

export function makeOptions(
    propName: PropNames,
    selectedFiltersByGroupName: IFiltersByGroupName,
    files: Entity[],
    getGroupsByProperty: any
): ExploreOptionType[] {
    const filteredFilesMinusOption = groupsByProperty(
        filterFiles(
            _.omit(selectedFiltersByGroupName, [propName]),
            files
        )
    )[propName];

    return _.map(getGroupsByProperty[propName], (val, key) => {
        const count = key in filteredFilesMinusOption ? filteredFilesMinusOption[key].length : 0;
        return {
            value: key,
            label: key,
            group: propName,
            count
        };
    });
}
