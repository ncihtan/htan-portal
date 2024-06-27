import { DownloadSourceCategory, Entity } from '@htan/data-portal-commons';
import _ from 'lodash';
import React from 'react';
import { Table } from 'react-bootstrap';
import { generatePublicationPageTabUrl } from '../lib/dataTableHelpers';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faLockOpen } from '@fortawesome/free-solid-svg-icons';

interface IDataAvailabilityTableProps {
    assays: { [assayName: string]: Entity[] };
    publicationId: string;
}

export const DataAvailabilityTable: React.FunctionComponent<IDataAvailabilityTableProps> = (
    props
) => {
    const tableRowGroups: { [rowName: string]: Entity[] } = _.reduce(
        _.keys(props.assays),
        (acc, assayId) => {
            const entities = props.assays[assayId];
            const entityGroupByLevel = _.groupBy(
                entities,
                (entity) => entity.level
            );
            for (const groupId in entityGroupByLevel) {
                acc[`${assayId} ${groupId === 'Unknown' ? '' : groupId}`] =
                    entityGroupByLevel[groupId];
            }
            return acc;
        },
        {} as { [rowName: string]: Entity[] }
    );

    const table = (
        <Table bordered hover responsive style={{ width: '55%' }}>
            <thead>
                <tr>
                    <th>Files</th>
                    <th>
                        <a href="/data-access">CDS/SB-CGC (dbGaP 🔒)</a>
                    </th>
                    <th>
                        <a href="/data-access">
                            CDS/SB-CGC (Open Access{` `}
                            <FontAwesomeIcon
                                color="#1adb54"
                                icon={faLockOpen}
                            />
                            )
                        </a>
                    </th>
                    <th>
                        <a href="/data-access">
                            Synapse (Open Access{` `}
                            <FontAwesomeIcon
                                color="#1adb54"
                                icon={faLockOpen}
                            />
                            )
                        </a>
                    </th>
                    <th>
                        <a href="/data-access">Coming Soon</a>
                    </th>
                </tr>
            </thead>
            <tbody>
                {_.map(_.keys(tableRowGroups).sort(), (rowName) => {
                    const entities = tableRowGroups[rowName];
                    const tabId =
                        entities.length > 0
                            ? entities[0]?.assayName
                            : undefined;
                    const cdsDbgapCount = entities.filter(
                        (entity) =>
                            entity.downloadSource ===
                            DownloadSourceCategory.dbgap
                    ).length;
                    const cdsOpenAccessCount = entities.filter(
                        (entity) =>
                            entity.downloadSource === DownloadSourceCategory.cds
                    ).length;
                    const synapseOpenAccessConut = entities.filter(
                        (entity) =>
                            entity.downloadSource ===
                            DownloadSourceCategory.synapse
                    ).length;
                    const comingSoonCount = entities.filter(
                        (entity) =>
                            entity.downloadSource ===
                            DownloadSourceCategory.comingSoon
                    ).length;

                    if (tabId) {
                        const link = generatePublicationPageTabUrl(
                            props.publicationId,
                            tabId
                        );
                        return (
                            <tr>
                                <td>{rowName}</td>
                                <td>
                                    <a href={link}>{cdsDbgapCount}</a>
                                </td>
                                <td>
                                    <a href={link}>{cdsOpenAccessCount}</a>
                                </td>
                                <td>
                                    <a href={link}>{synapseOpenAccessConut}</a>
                                </td>
                                <td>
                                    <a href={link}>{comingSoonCount}</a>
                                </td>
                            </tr>
                        );
                    }
                })}
            </tbody>
        </Table>
    );
    return table;
};

export default DataAvailabilityTable;
