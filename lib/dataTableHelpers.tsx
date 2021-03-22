import ExpandableText from '../components/ExpandableText';
import { Entity } from './helpers';
import * as React from 'react';

export function getDefaultDataTableStyle() {
    return {
        headCells: {
            style: {
                fontSize: 16,
                fontWeight: 'bold',
            },
        },
        cells: {
            style: {
                fontSize: 14,
            },
        },
    };
}

export function truncatedTableCell(file: Entity) {
    //@ts-ignore
    const value = this.selector(file);
    return <ExpandableText fullText={value} truncateProps={{ lines: 4 }} />;
}
