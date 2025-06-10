import * as React from 'react';
import _ from 'lodash';
import Tooltip from 'rc-tooltip';
import { IEnhancedDataTableColumn } from '@htan/data-portal-table';
import {
    getUniqDependencyIds,
    isNumericalSchemaData,
    SchemaDataById,
    SchemaDataId,
} from '@htan/data-portal-schema';
import {
    Atlas,
    Entity,
    ExpandableText,
    PublicationIcon,
    PublicationManifest,
} from '@htan/data-portal-commons';

export function generateColumnsForDataSchema<T>(
    schemaDataIds: SchemaDataId[],
    schemaDataById?: SchemaDataById,
    genericAttributeMap?: { [attr: string]: string },
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
        const dependencies = getUniqDependencyIds(
            schemaDataIds,
            schemaDataById
        );

        columns = _.compact(
            dependencies.map((id) => {
                const schema = schemaDataById[id];

                if (schema && !excludedColumns?.includes(schema.label)) {
                    const selector = genericAttributeMap
                        ? genericAttributeMap[schema.label] || schema.label
                        : schema.label;
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

export function getAtlasColumn(atlases: Atlas[]) {
    const atlasMap = _.keyBy(atlases, (a) => a.htan_id);

    return {
        id: 'Atlas Name',
        name: (
            <Tooltip overlay="Name of the Atlas">
                <span>Atlas Name</span>
            </Tooltip>
        ),
        selector: (sample: Entity) => atlasMap[sample.atlasid].htan_name,
        wrap: true,
        sortable: true,
    };
}

export function getPublicationColumn(publicationsByUid?: {
    [uid: string]: PublicationManifest;
}) {
    return {
        name: 'Publications',
        selector: 'publicationIds',
        wrap: true,
        sortable: true,
        searchable: false,
        omit: false,
        cell: (entity: Entity) =>
            entity.publicationIds?.map((uid) =>
                publicationsByUid && publicationsByUid[uid] ? (
                    <PublicationIcon
                        publicationManifest={publicationsByUid[uid]}
                    />
                ) : (
                    `${uid} `
                )
            ),
    };
}

function getDefaultHtanIdIteratees(getValue: (row: Entity) => string) {
    // get iteratees for ids which take the form HTA[integer]_[integer]
    return [
        (row: Entity) => Number(getValue(row).split('_')[0].replace('HTA', '')),
        (row: Entity) => Number(getValue(row).split('_')[1]),
    ];
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

export function sortByParticipantId(rowA: Entity, rowB: Entity) {
    // we need sort by participant id which takes the form HTA[integer]_[integer]
    const iteratees = getDefaultHtanIdIteratees((row) => row.ParticipantID);
    return defaultNumericalComparison(rowA, rowB, iteratees);
}

export function sortByParentID(rowA: Entity, rowB: Entity) {
    // TODO parent id potentially can also take the form HTA[integer]_[integer]_[integer]
    // we need sort by parent id which takes the form HTA[integer]_[integer]
    const iteratees = getDefaultHtanIdIteratees((row) => row.ParentID);
    return defaultNumericalComparison(rowA, rowB, iteratees);
}

export function sortByBiospecimenId(rowA: Entity, rowB: Entity) {
    // we need sort by biospecimen id which takes the form HTA[integer]_[integer]_[integer]
    const iteratees = getDefaultHtanIdIteratees((row) => row.BiospecimenID);
    // additional iteratee for the last integer
    iteratees.push((row: Entity) => Number(row.BiospecimenID.split('_')[2]));

    return defaultNumericalComparison(rowA, rowB, iteratees);
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

export function generatePublicationPageTabUrl(
    publicationId: string,
    tabId: string
) {
    if (tabId.includes('&')) {
        // & is reserved charactor in url so cannot be encoded. We need to manually encode & for H&E tab
        tabId = _.replace(tabId.toLowerCase(), new RegExp('&', 'g'), '%26');
    }
    const link = `/publications/${publicationId}?tab=${_.replace(
        tabId.toLowerCase(),
        new RegExp(' ', 'g'),
        '-'
    )}`;
    return link;
}
