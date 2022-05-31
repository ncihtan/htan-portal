import _ from 'lodash';
import Tooltip from 'rc-tooltip';
import * as React from 'react';

import { IEnhancedDataTableColumn } from '../components/EnhancedDataTable';
import ExpandableText from '../components/ExpandableText';
import {
    DataSchemaData,
    isNumericalSchemaData,
    SchemaDataId,
} from './dataSchemaHelpers';
import { Atlas, Entity } from './helpers';

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

function getDefaultHtanIdIteratees(getValue: (row: Entity) => string) {
    // get iteratees for ids which take the form HTA[integer]_[integer]
    return [
        (row: Entity) => Number(getValue(row).split('_')[0].replace('HTA', '')),
        (row: Entity) => Number(getValue(row).split('_')[1]),
    ];
}

export function sortByHtanParticipantId(rowA: Entity, rowB: Entity) {
    // we need sort by participant id which takes the form HTA[integer]_[integer]
    const iteratees = getDefaultHtanIdIteratees((row) => row.HTANParticipantID);
    return defaultNumericalComparison(rowA, rowB, iteratees);
}

export function sortByHtanParentId(rowA: Entity, rowB: Entity) {
    // TODO parent id potentially can also take the form HTA[integer]_[integer]_[integer]
    // we need sort by parent id which takes the form HTA[integer]_[integer]
    const iteratees = getDefaultHtanIdIteratees((row) => row.HTANParentID);
    return defaultNumericalComparison(rowA, rowB, iteratees);
}

export function sortByBiospecimenId(rowA: Entity, rowB: Entity) {
    // we need sort by biospecimen id which takes the form HTA[integer]_[integer]_[integer]
    const iteratees = getDefaultHtanIdIteratees((row) => row.HTANBiospecimenID);
    // additional iteratee for the last integer
    iteratees.push((row: Entity) =>
        Number(row.HTANBiospecimenID.split('_')[2])
    );

    return defaultNumericalComparison(rowA, rowB, iteratees);
}

export function getAtlasColumn(atlases: Atlas[]) {
    const atlasMap = _.keyBy(atlases, (a) => a.htan_id);

    return {
        id: 'Lab Name',
        name: (
            <Tooltip overlay="Name of the Lab">
                <span>Research Team</span>
            </Tooltip>
        ),
        selector: (sample: Entity) => atlasMap[sample.atlasid].htan_name,
        wrap: true,
        sortable: true,
    };
}

export function generateColumnsForDataSchema<T>(
    schemaDataIds: SchemaDataId[],
    schemaDataById?: { [schemaDataId: string]: DataSchemaData },
    columnOverrides?: {
        [columnKey: string]: Partial<
            IEnhancedDataTableColumn<T> & {
                headerTooltip?: string | React.ReactNode;
            }
        >;
    },
    excludedColumns?: string[]
): IEnhancedDataTableColumn<T>[] {
    let columns: IEnhancedDataTableColumn<T>[] = [];

    if (schemaDataById) {
        const dependencies = _.uniq(
            _.flatten(
                schemaDataIds.map((schemaDataId) => {
                    const dataSchema = schemaDataById[schemaDataId];
                    return dataSchema ? dataSchema.requiredDependencies : [];
                })
            )
        );

        columns = _.compact(
            dependencies.map((id) => {
                const schema = schemaDataById[id];

                if (schema && !excludedColumns?.includes(schema.label)) {
                    const selector = schema.label;
                    const columnOverride = (columnOverrides || {})[selector];
                    const name = columnOverride?.name || schema.attribute;
                    const headerTooltip =
                        columnOverride?.headerTooltip || schema.description;
                    const cell = isNumericalSchemaData(schema)
                        ? (row: T) => (
                              <span className="ml-auto">
                                  {(row as any)[selector]}
                              </span>
                          )
                        : undefined;

                    return {
                        id: schema.attribute,
                        selector,
                        cell,
                        omit: !schema.required,
                        wrap: true,
                        sortable: true,
                        ...columnOverride,
                        // do not override the actual name field
                        // we still want to keep the tooltip even if the name is customized
                        name: (
                            <Tooltip overlay={<span>{headerTooltip}</span>}>
                                <span>{name}</span>
                            </Tooltip>
                        ),
                    };
                } else {
                    return undefined;
                }
            })
        );
    }

    return columns;
}
