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

    const getDateTime = (manifest: PublicationManifest) => {
        const summary = getSummary(manifest);
        const date = summary
            ? new Date(getPublicationDate(summary, manifest) || 0)
            : new Date(0);
        return date.getTime();
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
            sortable: true
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
                if (
                    manifest.PublicationContentType?.toLowerCase() ===
                    PublicationContentType.Prepublication
                ) {
                    return <span className="text-danger">In Review</span>;
                } else if (
                    manifest.PublicationContentType?.toLowerCase() ===
                    PublicationContentType.Preprint
                ) {
                    return <span>Preprint</span>;
                } else if (
                    manifest.PublicationContentType?.toLowerCase() ===
                    PublicationContentType.Published
                ) {
                    return <span>Published</span>;
                } else {
                    return manifest.PublicationContentType;
                }
            },
            wrap: true,
            sortable: true,
            omit: true,
        },
        {
            name: 'Publication Date',
            selector: (manifest: PublicationManifest) => getDateTime(manifest),
            cell: (manifest: PublicationManifest) => {
                const summary = getSummary(manifest);
                const date = getPublicationDate(summary, manifest);

                if (summary && date) {
                    const formatted = Intl.DateTimeFormat('en-US', {
                        year: 'numeric',
                        month: 'short',
                    }).formatToParts(new Date(date));
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
