import * as React from 'react';

export function getColumnKey(col: {
    id?: string | number;
    name: string | number | React.ReactNode;
}): string {
    // if no id exists, just use name for key
    return (col.id || col.name || '').toString();
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
