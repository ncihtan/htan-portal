import { DownloadSourceCategory, Entity } from '@htan/data-portal-commons';
import _ from 'lodash';
import React from 'react';
import { Table } from 'react-bootstrap';
import { generatePublicationPageTabUrl } from '../lib/dataTableHelpers';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faLock, faLockOpen } from '@fortawesome/free-solid-svg-icons';

interface IDataAvailabilityTableProps {
    assays: { [assayName: string]: Entity[] };
    publicationId: string;
}

interface ITableRowData {
    tabId?: string;
    rowName: string;
    crdcGcDbgapCount: number;
    crdcGcOpenAccessCount: number;
    synapseOpenAccessCount: number;
    comingSoonCount: number;
    comingSoonText: string | number;
}

// In Coming Soon column, show 'TBD' if the assay is in customTBDGroup
// TODO: need to double check if we should update/remove any assay out of the list after a new data release
const customizedTBDGroup: { [group: string]: string[] } = {
    'hta1_2024_nature-medicine_johanna-klughammer': [
        'CODEX',
        'ExSEQ',
        'Slide-seq V2',
        'MERFISH',
    ],
};

function isInCustomizedTBDGroup(
    group: string,
    customizedTBDGroup: { [group: string]: string[] },
    publicationId: string
) {
    return customizedTBDGroup[publicationId]?.includes(group);
}

export const LinkComponent: React.FunctionComponent<{
    link: string;
    count: string | number;
}> = (props) => {
    return props.count.toString() === '0' ||
        props.count.toString() === 'TBD' ? (
        <td style={{ textAlign: 'right' }}>{props.count}</td>
    ) : (
        <td style={{ textAlign: 'right' }}>
            <a href={props.link}>{props.count}</a>
        </td>
    );
};

function getTableRowGroups(assays: {
    [assayName: string]: Entity[];
}): { [rowName: string]: Entity[] } {
    return _.reduce(
        _.keys(assays),
        (acc, assayId) => {
            const entities = assays[assayId];
            const entityGroupByLevel = _.groupBy(
                entities,
                (entity) => entity.level
            );
            for (const groupId in entityGroupByLevel) {
                if (groupId === 'Unknown') {
                    acc[`${assayId}`] = entityGroupByLevel[groupId];
                } else {
                    acc[`${assayId} ${groupId}`] = entityGroupByLevel[groupId];
                }
            }
            return acc;
        },
        {} as { [rowName: string]: Entity[] }
    );
}

function getTableRowData(
    tableRowGroups: { [rowName: string]: Entity[] },
    publicationId: string
): ITableRowData[] {
    return _.map(_.keys(tableRowGroups).sort(), (rowName) => {
        const entities = tableRowGroups[rowName];
        const tabId = entities.length > 0 ? entities[0]?.assayName : undefined;
        const crdcGcDbgapCount = entities.filter(
            (entity) => entity.downloadSource === DownloadSourceCategory.dbgap
        ).length;
        const crdcGcOpenAccessCount = entities.filter(
            (entity) => entity.downloadSource === DownloadSourceCategory.crdcGc
        ).length;
        const synapseOpenAccessCount = entities.filter(
            (entity) => entity.downloadSource === DownloadSourceCategory.synapse
        ).length;
        const comingSoonCount = entities.filter(
            (entity) =>
                entity.downloadSource === DownloadSourceCategory.comingSoon
        ).length;
        // If the assay has 0 in Coming Soon column AND is in the customized TBD group, show 'TBD' instead of 0
        const comingSoonText =
            comingSoonCount === 0 &&
            isInCustomizedTBDGroup(rowName, customizedTBDGroup, publicationId)
                ? 'TBD'
                : comingSoonCount;

        return {
            tabId,
            rowName,
            crdcGcDbgapCount,
            crdcGcOpenAccessCount,
            synapseOpenAccessCount,
            comingSoonCount,
            comingSoonText,
        };
    });
}

function getTotalCountByDownloadSource(tableRowData: ITableRowData[]) {
    return _.mapValues(
        {
            [DownloadSourceCategory.dbgap]: 'crdcGcDbgapCount',
            [DownloadSourceCategory.crdcGc]: 'crdcGcOpenAccessCount',
            [DownloadSourceCategory.synapse]: 'synapseOpenAccessCount',
            [DownloadSourceCategory.comingSoon]: 'comingSoonCount',
        },
        (value) => _.sumBy(tableRowData, value)
    );
}

export const DataAvailabilityTable: React.FunctionComponent<IDataAvailabilityTableProps> = (
    props
) => {
    const tableRowGroups = getTableRowGroups(props.assays);
    const tableRowData = getTableRowData(tableRowGroups, props.publicationId);
    const totalCountByDownloadSource = getTotalCountByDownloadSource(
        tableRowData
    );

    return (
        <Table bordered hover responsive style={{ width: '60%' }}>
            <thead>
                <tr>
                    <th>Files</th>
                    {totalCountByDownloadSource[DownloadSourceCategory.dbgap] >
                        0 && (
                        <th>
                            <a href="/data-access">
                                CRDC-GC/SB-CGC (dbGaP{' '}
                                <FontAwesomeIcon
                                    color="#FF8C00"
                                    icon={faLock}
                                />
                                )
                            </a>
                        </th>
                    )}
                    {totalCountByDownloadSource[DownloadSourceCategory.crdcGc] >
                        0 && (
                        <th>
                            <a href="/data-access">
                                CRDC-GC/SB-CGC (Open Access{` `}
                                <FontAwesomeIcon
                                    color="#00796B"
                                    icon={faLockOpen}
                                />
                                )
                            </a>
                        </th>
                    )}
                    {totalCountByDownloadSource[
                        DownloadSourceCategory.synapse
                    ] > 0 && (
                        <th>
                            <a href="/data-access">
                                Synapse (Open Access{` `}
                                <FontAwesomeIcon
                                    color="#00796B"
                                    icon={faLockOpen}
                                />
                                )
                            </a>
                        </th>
                    )}
                    {totalCountByDownloadSource[
                        DownloadSourceCategory.comingSoon
                    ] > 0 && (
                        <th>
                            <a href="/data-access">Coming Soon</a>
                        </th>
                    )}
                </tr>
            </thead>
            <tbody>
                {tableRowData.map(
                    ({
                        tabId,
                        rowName,
                        crdcGcDbgapCount,
                        crdcGcOpenAccessCount,
                        synapseOpenAccessCount,
                        comingSoonText,
                    }) => {
                        if (tabId) {
                            const link = generatePublicationPageTabUrl(
                                props.publicationId,
                                tabId
                            );
                            return (
                                <tr>
                                    <td style={{ textAlign: 'left' }}>
                                        {rowName}
                                    </td>
                                    {totalCountByDownloadSource[
                                        DownloadSourceCategory.dbgap
                                    ] > 0 && (
                                        <LinkComponent
                                            link={link}
                                            count={crdcGcDbgapCount}
                                        />
                                    )}
                                    {totalCountByDownloadSource[
                                        DownloadSourceCategory.crdcGc
                                    ] > 0 && (
                                        <LinkComponent
                                            link={link}
                                            count={crdcGcOpenAccessCount}
                                        />
                                    )}
                                    {totalCountByDownloadSource[
                                        DownloadSourceCategory.synapse
                                    ] > 0 && (
                                        <LinkComponent
                                            link={link}
                                            count={synapseOpenAccessCount}
                                        />
                                    )}
                                    {totalCountByDownloadSource[
                                        DownloadSourceCategory.comingSoon
                                    ] > 0 && (
                                        <LinkComponent
                                            link={link}
                                            count={comingSoonText}
                                        />
                                    )}
                                </tr>
                            );
                        }
                    }
                )}
            </tbody>
        </Table>
    );
};

export default DataAvailabilityTable;
