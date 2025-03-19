import _ from 'lodash';
import React from 'react';
import { faExternalLinkAlt } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    AtlasDescription,
    Entity,
    getPublicationAuthors,
    getPublicationDate,
    getPublicationDOI,
    getPublicationJournal,
    getPublicationPubMedID,
    getPublicationTitle,
    getPublicationUid,
    PublicationContentType,
    PublicationManifest,
    PublicationSummary,
} from '@htan/data-portal-commons';
import {
    EnhancedDataTable,
    getDefaultDataTableStyle,
} from '@htan/data-portal-table';

interface IPublicationTableProps {
    publications: PublicationManifest[];
    publicationSummaryByPubMedID?: { [pubMedId: string]: PublicationSummary };
    participants: Entity[];
    filteredParticipants: Entity[];
    biospecimens: Entity[];
    filteredBiospecimens: Entity[];
    files: Entity[];
    filteredFiles: Entity[];
}

function getCounts(
    manifest: PublicationManifest,
    filteredEntities: Entity[],
    unfilteredEntities: Entity[],
    countFn: (
        manifest: PublicationManifest,
        entities: Entity[]
    ) => number = getEntityCount
) {
    const filteredCount = countFn(manifest, filteredEntities);
    const unfilteredCount =
        filteredEntities.length === unfilteredEntities.length
            ? filteredCount
            : countFn(manifest, unfilteredEntities);

    return {
        filteredCount,
        unfilteredCount,
    };
}

function getAssayCount(manifest: PublicationManifest, files: Entity[]) {
    const uid = getPublicationUid(manifest);

    return _(files)
        .filter((f) => f.publicationIds?.includes(uid) || false)
        .map((f) => f.assayName)
        .uniq()
        .value().length;
}

function getCountString(filteredCount: number, unfilteredCount: number) {
    const filteredCountString =
        filteredCount !== unfilteredCount ? `${filteredCount}/` : '';

    return `${filteredCountString}${unfilteredCount}`;
}

function getEntityCount(manifest: PublicationManifest, entities: Entity[]) {
    const uid = getPublicationUid(manifest);

    return entities.filter((p) => p.publicationIds?.includes(uid)).length;
}

const Count: React.FunctionComponent<{
    filteredCount: number;
    unfilteredCount: number;
}> = (props) => {
    return (
        <span className="ml-auto">
            {getCountString(props.filteredCount, props.unfilteredCount)}
        </span>
    );
};

export const PublicationTable: React.FunctionComponent<IPublicationTableProps> = (
    props
) => {
    const getSummary = (manifest: PublicationManifest) =>
        props.publicationSummaryByPubMedID?.[getPublicationPubMedID(manifest)];

    const getDate = (manifest: PublicationManifest) => {
        const summary = getSummary(manifest);
        const date = getPublicationDate(summary, manifest);

        // Assuming that the string is in the form of YYYY MMM DD
        const parts = date?.split(/\s/);

        let day = '1';
        let month = '';
        let year = '';

        if (parts) {
            day = parts.length > 2 ? parts[2] : day;
            month = parts.length > 1 ? parts[1] : month;
            year = parts[0];
        }

        if (year && month) {
            return new Date(`${day} ${month} ${year}`);
        } else {
            return undefined;
        }
    };

    const getDateTime = (manifest: PublicationManifest) => {
        return getDate(manifest)?.getTime() || 0;
    };

    const columns = [
        {
            name: 'Title',
            selector: (manifest: PublicationManifest) =>
                getPublicationTitle(getSummary(manifest), manifest),
            cell: (manifest: PublicationManifest) => (
                <a
                    href={`//${
                        window.location.host
                    }/publications/${getPublicationUid(manifest)}`}
                    className="py-1"
                >
                    {getPublicationTitle(getSummary(manifest), manifest)}
                </a>
            ),
            grow: 1.5,
            wrap: true,
            sortable: true,
        },
        {
            name: 'Atlas',
            selector: (manifest: PublicationManifest) => manifest.atlas_name,
            cell: (manifest: PublicationManifest) => (
                <AtlasDescription
                    atlasMeta={manifest.AtlasMeta}
                    atlasName={manifest.AtlasMeta.lead_institutions}
                />
            ),
            wrap: true,
            sortable: true,
        },
        {
            name: 'Authors',
            selector: (manifest: PublicationManifest) =>
                getPublicationAuthors(getSummary(manifest), manifest).join(
                    ', '
                ),
            cell: (manifest: PublicationManifest) => {
                const authors = getPublicationAuthors(
                    getSummary(manifest),
                    manifest
                );
                let shortList = authors;

                if (authors.length > 5) {
                    shortList = authors.slice(0, 4).concat('et al.');
                }

                return shortList.join(', ');
            },
            wrap: true,
            sortable: true,
        },
        {
            name: 'Journal',
            selector: (manifest: PublicationManifest) =>
                getPublicationJournal(getSummary(manifest), manifest),
            wrap: true,
            sortable: true,
        },
        {
            name: 'Publication Date',
            selector: (manifest: PublicationManifest) => getDateTime(manifest),
            cell: (manifest: PublicationManifest) => {
                const date = getDate(manifest);

                if (date) {
                    const formatted = Intl.DateTimeFormat('en-US', {
                        year: 'numeric',
                        month: 'short',
                    }).formatToParts(date);
                    const year = formatted.find((s) => s.type === 'year')
                        ?.value;
                    const month = formatted.find((s) => s.type === 'month')
                        ?.value;
                    return `${year} ${month}`;
                } else {
                    return '';
                }
            },
            wrap: true,
            sortable: true,
        },
        {
            name: 'DOI',
            selector: (manifest: PublicationManifest) =>
                getPublicationDOI(getSummary(manifest), manifest),
            cell: (manifest: PublicationManifest) => {
                const doi = getPublicationDOI(getSummary(manifest), manifest);
                return doi ? (
                    <a href={`https://doi.org/${doi}`}>
                        {doi} <FontAwesomeIcon icon={faExternalLinkAlt} />
                    </a>
                ) : undefined;
            },
            wrap: true,
            sortable: true,
            omit: true,
        },
        {
            name: 'PubMed',
            selector: (manifest: PublicationManifest) =>
                getPublicationPubMedID(manifest),
            cell: (manifest: PublicationManifest) => {
                const pubmedId = getPublicationPubMedID(manifest);
                return pubmedId ? (
                    <a href={`https://pubmed.ncbi.nlm.nih.gov/${pubmedId}`}>
                        {pubmedId} <FontAwesomeIcon icon={faExternalLinkAlt} />
                    </a>
                ) : undefined;
            },
            grow: 0.5,
            wrap: true,
            sortable: true,
        },
        {
            name: 'Participants',
            selector: (manifest: PublicationManifest) =>
                getEntityCount(manifest, props.filteredParticipants),
            cell: (manifest: PublicationManifest) => {
                const { filteredCount, unfilteredCount } = getCounts(
                    manifest,
                    props.filteredParticipants,
                    props.participants
                );
                return (
                    <Count
                        filteredCount={filteredCount}
                        unfilteredCount={unfilteredCount}
                    />
                );
            },
            grow: 0.5,
            wrap: true,
            sortable: true,
        },
        {
            name: 'Biospecimens',
            selector: (manifest: PublicationManifest) =>
                getEntityCount(manifest, props.filteredBiospecimens),
            cell: (manifest: PublicationManifest) => {
                const { filteredCount, unfilteredCount } = getCounts(
                    manifest,
                    props.filteredBiospecimens,
                    props.biospecimens
                );
                return (
                    <Count
                        filteredCount={filteredCount}
                        unfilteredCount={unfilteredCount}
                    />
                );
            },
            grow: 0.7,
            wrap: true,
            sortable: true,
        },
        {
            name: 'Assays',
            selector: (manifest: PublicationManifest) =>
                getAssayCount(manifest, props.filteredFiles),
            cell: (manifest: PublicationManifest) => {
                const { filteredCount, unfilteredCount } = getCounts(
                    manifest,
                    props.filteredFiles,
                    props.files,
                    getAssayCount
                );
                return (
                    <Count
                        filteredCount={filteredCount}
                        unfilteredCount={unfilteredCount}
                    />
                );
            },
            grow: 0.5,
            wrap: true,
            sortable: true,
            omit: true,
        },
        {
            name: 'Content Type',
            selector: (manifest: PublicationManifest) =>
                manifest.PublicationContentType,
            cell: (manifest: PublicationManifest) => {
                const type = manifest.PublicationContentType?.toLowerCase();
                if (type === PublicationContentType.Prepublication) {
                    return <span className="text-danger">In Review</span>;
                } else if (type === PublicationContentType.Preprint) {
                    return <span>Preprint</span>;
                } else if (type === PublicationContentType.Published) {
                    return <span>Published</span>;
                } else if (type === PublicationContentType.Accepted) {
                    return <span>Accepted</span>;
                } else {
                    return manifest.PublicationContentType;
                }
            },
            wrap: true,
            sortable: true,
            omit: true,
        },
    ];

    const sortedData = _(props.publications)
        .sortBy(getDateTime)
        .reverse()
        .value();

    return (
        <EnhancedDataTable
            columns={columns}
            data={sortedData}
            striped={true}
            dense={false}
            noHeader={true}
            pagination={true}
            paginationPerPage={50}
            paginationRowsPerPageOptions={[10, 20, 50, 100, 500]}
            customStyles={getDefaultDataTableStyle()}
        />
    );
};

export default PublicationTable;
