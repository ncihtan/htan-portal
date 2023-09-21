import _ from 'lodash';
import * as React from 'react';

import ExpandableText from '../components/ExpandableText';
import { getDefaultDataTableStyle } from '../packages/data-portal-table/src/libs/helpers';

export function getDataSchemaDataTableStyle() {
    const defaultStyle = getDefaultDataTableStyle();

    return {
        ...defaultStyle,
        header: {
            style: {
                fontSize: 16,
            },
        },
        cells: {
            ...defaultStyle.cells,
            lineHeight: '1.5em',
        },
        rows: {
            style: {
                paddingTop: '10px',
                paddingBottom: '10px',
            },
        },
    };
}

export function truncatedTableCell<T>(cellData: T) {
    //@ts-ignore
    const selector = this.selector;
    const value = _.isFunction(selector)
        ? selector(cellData)
        : cellData[selector as keyof T];

    return value ? (
        <ExpandableText fullText={value} truncateProps={{ lines: 4 }} />
    ) : null;
}
