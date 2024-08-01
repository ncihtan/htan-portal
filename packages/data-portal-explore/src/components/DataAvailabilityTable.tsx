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

export const LinkComponent: React.FunctionComponent<{
    link: string;
    count: string;
}> = (props) => {
    return props.count === '0' || props.count === 'TBD' ? (
        <td style={{ textAlign: 'right' }}>{props.count}</td>
    ) : (
        <td style={{ textAlign: 'right' }}>
            <a href={props.link}>{props.count}</a>
        </td>
    );
};

export const DataAvailabilityTable: React.FunctionComponent<IDataAvailabilityTableProps> = (
    props
) => {
    // In Coming Soon column, show 'TBD' if the level is unknown (the "unknown" is removed in the row name)
    // unknownLevelGroups is used to keep track of the unknown level group name
    const unknownLevelGroups = new Set();

    const tableRowGroups: { [rowName: string]: Entity[] } = _.reduce(
        _.keys(props.assays),
        (acc, assayId) => {
            const entities = props.assays[assayId];
            const entityGroupByLevel = _.groupBy(
                entities,
                (entity) => entity.level
            );
            for (const groupId in entityGroupByLevel) {
                if (groupId === 'Unknown') {
                    unknownLevelGroups.add(assayId);
                    acc[`${assayId}`] = entityGroupByLevel[groupId];
                } else {
                    acc[`${assayId} ${groupId}`] = entityGroupByLevel[groupId];
                }
            }
            return acc;
        },
        {} as { [rowName: string]: Entity[] }
    );

    // If all groups have 0 in Coming Soon column, don't show the column
    let showComingSoonColumn = false;
    // Check if there is any entity has non-zero value in Coming Soon column
    _.forEach(tableRowGroups, (entities) => {
        const comingSoonCount = _.filter(
            entities,
            (entity) =>
                entity.downloadSource === DownloadSourceCategory.comingSoon
        ).length;
        if (comingSoonCount > 0) {
            showComingSoonColumn = true;
            return false;
        }
    });

    const table = (
        <Table bordered hover responsive style={{ width: '60%' }}>
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
                    {showComingSoonColumn && (
                        <th>
                            <a href="/data-access">Coming Soon</a>
                        </th>
                    )}
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
                    const comingSoonCount = unknownLevelGroups.has(rowName)
                        ? 'TBD'
                        : entities.filter(
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
                                <td style={{ textAlign: 'left' }}>{rowName}</td>
                                <LinkComponent
                                    link={link}
                                    count={cdsDbgapCount.toString()}
                                />
                                <LinkComponent
                                    link={link}
                                    count={cdsOpenAccessCount.toString()}
                                />
                                <LinkComponent
                                    link={link}
                                    count={synapseOpenAccessConut.toString()}
                                />
                                {showComingSoonColumn && (
                                    <LinkComponent
                                        link={link}
                                        count={comingSoonCount.toString()}
                                    />
                                )}
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
