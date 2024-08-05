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

// In Coming Soon column, show 'TBD' if the assay is in customTBDGroup
// TODO: need to double check if we should update/remove any assay out of the list after a new data release
const customizedTBDGroup: { [group: string]: string[] } = {
    'hta1_2024_pdf_johanna-klughammer': [
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
                    const comingSoonCount = entities.filter(
                        (entity) =>
                            entity.downloadSource ===
                            DownloadSourceCategory.comingSoon
                    ).length;
                    // If the assay has 0 in Coming Soon column AND is in the customized TBD group, show 'TBD' instead of 0
                    const comingSoonText =
                        comingSoonCount === 0 &&
                        isInCustomizedTBDGroup(
                            rowName,
                            customizedTBDGroup,
                            props.publicationId
                        )
                            ? 'TBD'
                            : comingSoonCount;

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
                                    count={cdsDbgapCount}
                                />
                                <LinkComponent
                                    link={link}
                                    count={cdsOpenAccessCount}
                                />
                                <LinkComponent
                                    link={link}
                                    count={synapseOpenAccessConut}
                                />
                                {showComingSoonColumn && (
                                    <LinkComponent
                                        link={link}
                                        count={comingSoonText}
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
