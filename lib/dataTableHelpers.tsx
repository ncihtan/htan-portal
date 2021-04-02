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

interface ISimpleColumnVisibilityDef {
    name: string;
    id?: string;
    visible?: boolean;
}

export function resolveColumnVisibilityByColumnDefinition(
    columns: ISimpleColumnVisibilityDef[] = []
): { [columnId: string]: boolean } {
    const colVis: { [columnId: string]: boolean } = {};

    columns.forEach((column: ISimpleColumnVisibilityDef) => {
        // every column is visible by default unless it is flagged otherwise
        let visible = true;

        if (column.visible !== undefined) {
            visible = column.visible;
        }

        // if no id exists, just use name for key
        const key = column.id || column.name;

        colVis[key] = visible;
    });

    return colVis;
}

export function resolveColumnVisibility(
    columnVisibilityByColumnDefinition: { [columnId: string]: boolean },
    columnVisibility?: { [columnId: string]: boolean },
    columnVisibilityOverride?: { [columnId: string]: boolean }
): { [columnId: string]: boolean } {
    let colVis: { [columnId: string]: boolean };

    // if a custom columnVisibility object is provided use that one
    if (columnVisibility) {
        colVis = { ...columnVisibility };
    } else {
        colVis = {
            // resolve visibility by column definition
            ...columnVisibilityByColumnDefinition,
            // if exists override with the state from the latest user selection
            ...(columnVisibilityOverride || {}),
        };
    }

    return colVis;
}

export function toggleColumnVisibility(
    columnVisibility: { [columnId: string]: boolean } | undefined,
    columnId: string,
    columnVisibilityDefs?: ISimpleColumnVisibilityDef[]
): { [columnId: string]: boolean } {
    let colVis = columnVisibility;

    // if not init yet: it means that no prior user action on column visibility
    // just copy the contents from the provided columnVisibility definition
    if (!colVis) {
        colVis = resolveColumnVisibilityByColumnDefinition(
            columnVisibilityDefs
        );
    }

    // toggle column visibility
    colVis[columnId] = !colVis[columnId];

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
