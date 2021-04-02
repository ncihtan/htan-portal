import * as React from 'react';

import ExpandableText from '../components/ExpandableText';
import { Entity } from './helpers';

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

export function getColumnKey(col: { id?: string; name: string }): string {
    // if no id exists, just use name for key
    return col.id || col.name;
}

export function getColumnVisibilityMap(
    columns: {
        name: string;
        id?: string;
        visible?: boolean;
    }[] = []
): { [columnKey: string]: boolean } {
    const colVis: { [columnKey: string]: boolean } = {};

    columns.forEach((column) => {
        // every column is visible by default unless it is flagged otherwise
        let visible = true;

        if (column.visible !== undefined) {
            visible = column.visible;
        }

        colVis[getColumnKey(column)] = visible;
    });

    return colVis;
}

export function resolveColumnVisibility(
    columnVisibilityByColumnDefinition: { [columnKey: string]: boolean },
    columnVisibility?: { [columnKey: string]: boolean },
    userSelectedColumnVisibility?: { [columnKey: string]: boolean }
): { [columnKey: string]: boolean } {
    let colVis: { [columnKey: string]: boolean };

    // if a custom columnVisibility object is provided use that one
    if (columnVisibility) {
        colVis = { ...columnVisibility };
    } else {
        colVis = {
            // resolve visibility by column definition
            ...columnVisibilityByColumnDefinition,
            // if exists override with the state from the latest user selection
            ...(userSelectedColumnVisibility || {}),
        };
    }

    return colVis;
}

function defaultNumericalComparison(
    rowA: Entity,
    rowB: Entity,
    iteratees: ((row: Entity) => number)[]
) {
    let comparison = 0;

    for (let iteratee of iteratees) {
        comparison = iteratee(rowA) - iteratee(rowB);

        if (comparison !== 0) {
            break;
        }
    }

    return comparison;
}

export function sortByHtanParticipantId(rowA: Entity, rowB: Entity) {
    // we need sort by participant id which takes the form HTA[integer]_[integer]
    const iteratees = [
        (row: Entity) =>
            Number(row.HTANParticipantID.split('_')[0].replace('HTA', '')),
        (row: Entity) => Number(row.HTANParticipantID.split('_')[1]),
    ];

    return defaultNumericalComparison(rowA, rowB, iteratees);
}

export function sortByBiospecimenId(rowA: Entity, rowB: Entity) {
    // we need sort by biospecimen id which takes the form HTA[integer]_[integer]_[integer]
    const iteratees = [
        (row: Entity) =>
            Number(row.HTANBiospecimenID.split('_')[0].replace('HTA', '')),
        (row: Entity) => Number(row.HTANBiospecimenID.split('_')[1]),
        (row: Entity) => Number(row.HTANBiospecimenID.split('_')[2]),
    ];

    return defaultNumericalComparison(rowA, rowB, iteratees);
}
