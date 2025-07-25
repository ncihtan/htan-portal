import fileDownload from 'js-file-download';
import { action, makeObservable, observable } from 'mobx';
import { observer } from 'mobx-react';
import React, { CSSProperties } from 'react';
import { Button, Modal } from 'react-bootstrap';
import Tooltip from 'rc-tooltip';
import _ from 'lodash';
import classNames from 'classnames';
import {
    faDownload,
    faExternalLinkAlt,
    faLockOpen,
    faLock,
    faHourglassStart,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import {
    getPublicationColumn,
    truncatedTableCell,
} from '../lib/dataTableHelpers';
import SimpleScrollPane from './SimpleScrollPane';
import { makeListColumn } from '../lib/fileTableHelpers';
import LevelSelect from './LevelSelect';

import styles from './fileTable.module.scss';

import {
    EnhancedDataTable,
    getDefaultDataTableStyle,
    IEnhancedDataTableColumn,
    selectorToColumnName,
} from '@htan/data-portal-table';
import {
    AttributeNames,
    GenericAttributeNames,
    getFileBase,
    interleave,
    truncateFilename,
} from '@htan/data-portal-utils';
import {
    addViewers,
    commonStyles,
    DownloadSourceCategory,
    Entity,
    FileAttributeMap,
    getViewerValues,
    PublicationManifest,
    ViewDetailsModal,
} from '@htan/data-portal-commons';
import { GroupsByProperty } from '@htan/data-portal-filter';

const CDS_MANIFEST_FILENAME = 'cds_manifest.csv';
const GEN3_MANIFEST_FILENAME = 'gen3_manifest.json';

interface IFileDownloadModalProps {
    files: Entity[];
    onClose: () => void;
    isOpen: boolean;
}

const DETAILS_COLUMN_NAME = 'Metadata';
const DRS_URI_HOSTNAME = 'drs://nci-crdc.datacommons.io/';

function getDrsUri(
    uri?: string,
    removeHostname: boolean = false,
    prependHostname: boolean = false,
    hostname = DRS_URI_HOSTNAME
) {
    let drsUri = uri;

    if (removeHostname || prependHostname) {
        // remove hostname in both cases to prevent duplicate hostname
        drsUri = drsUri?.replace(hostname, '');
    }

    if (prependHostname && drsUri) {
        drsUri = `${hostname}${drsUri}`;
    }

    return drsUri;
}

function generateCdsManifestFile(files: Entity[]): string | undefined {
    const columns = [
        'drs_uri',
        'name',
        'atlas_name',
        'biospecimen',
        'assay_name',
        'level',
        'data_file_id',
        'parent_biospecimen_id',
        'parent_data_file_id',
    ];
    const data = _(files)
        .filter((f) => !!f.viewers?.cds)
        .map((f) => [
            getDrsUri(f.viewers?.cds?.drs_uri, false, true),
            f.viewers?.cds?.name,
            f.atlas_name,
            _.uniq(f.biospecimenIds).join(' '),
            f.assayName,
            f.level,
            // make sure to replace all possible commas since we are generating a CSV file
            f.DataFileID?.replace(/,/g, ' ').trim(),
            f.ParentBiospecimenID?.replace(/,/g, ' ').trim(),
            f.ParentDataFileID?.replace(/,/g, ' ').trim(),
        ])
        .value();

    if (data.length > 0) {
        return [columns, ...data].map((row) => row.join(',')).join('\n');
    } else {
        return undefined;
    }
}

function generateGen3ManifestFile(files: Entity[]): string | undefined {
    const data = _(files)
        .filter((f) => !!f.viewers?.cds)
        .map((f) => ({
            object_id: getDrsUri(f.viewers?.cds?.drs_uri, true),
        }))
        .value();

    return data.length > 0 ? JSON.stringify(data, null, 2) : undefined;
}

const FilenameWithAccessIcon: React.FunctionComponent<{
    file: Entity;
}> = ({ file }) => {
    const isControlledAccess =
        file.downloadSource === DownloadSourceCategory.dbgap;
    const iconColor = isControlledAccess ? '#FF8C00' : '#00796B'; // Amber for controlled, Dark Teal for open

    return (
        <>
            <FontAwesomeIcon
                icon={isControlledAccess ? faLock : faLockOpen}
                color={iconColor}
            />{' '}
            {getFileBase(file.Filename)}
            {'\n'}
        </>
    );
};

const CDSFileList: React.FunctionComponent<{
    files: Entity[];
}> = (props) => {
    return (
        <pre className="pre-scrollable">
            <code>
                {props.files.map((f) => (
                    <FilenameWithAccessIcon file={f} />
                ))}
            </code>
        </pre>
    );
};

const dbgapInstructions = (files: Entity[]) => {
    const dbgapFiles = files.filter(
        (f) => f.downloadSource === DownloadSourceCategory.dbgap
    );
    if (dbgapFiles.length === 0) return null;

    return (
        <div>
            <CDSFileList files={files} />
            <p>
                Your selection includes controlled-access Level 1 and/or Level 2
                sequencing data (🔒). To download Level 1/2 sequencing data, you
                first need to have been granted access to the{' '}
                <a
                    href="https://www.ncbi.nlm.nih.gov/projects/gap/cgi-bin/study.cgi?study_id=phs002371"
                    target="_blank"
                >
                    HTAN dbGaP Study, Accession: phs002371
                </a>
                .
            </p>
        </div>
    );
};

const openAccessInstructions = (files: Entity[]) => {
    return (
        <div>
            <CDSFileList files={files} />
        </div>
    );
};

const cdsManifestInstructions = (manifestFile: string | undefined) => {
    if (!manifestFile) return null;

    return (
        <div>
            <p>
                <strong>Load Files into SevenBridges CGC:</strong> You can
                import these files into the{' '}
                <a href="https://docs.cancergenomicscloud.org" target="_blank">
                    SevenBridges Cancer Genomics Cloud (SB-CGC)
                </a>{' '}
                by downloading the CDS manifest file below and following the
                instructions{' '}
                <a
                    href="https://docs.cancergenomicscloud.org/docs/import-from-a-drs-server#import-from-a-manifest-file"
                    target="_blank"
                >
                    here
                </a>
                .
            </p>
            <button
                className="btn btn-light"
                onClick={() =>
                    fileDownload(manifestFile, CDS_MANIFEST_FILENAME)
                }
            >
                <FontAwesomeIcon icon={faDownload} /> Download{' '}
                <code>cds_manifest.csv</code>
            </button>
        </div>
    );
};

const gen3ManifestInstructions = (gen3manifestFile: string | undefined) => {
    if (!gen3manifestFile) return null;

    return (
        <div>
            <p></p>
            <p>
                <strong>Download Files using the Gen3 Client:</strong>{' '}
                <>
                    <ol>
                        <li>
                            Install the{' '}
                            <a
                                href="https://gen3.org/resources/user/gen3-client/#1-installation-instructions"
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                Gen3 Client
                            </a>
                        </li>
                        <li>
                            Get your{' '}
                            <a
                                href="https://nci-crdc.datacommons.io/identity"
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                NCI Data Commons Framework Services API Key
                            </a>
                        </li>
                        <li>
                            Configure a Gen3 profile by running:
                            <pre className="pre-scrollable">
                                <code>
                                    {`gen3-client configure \\
    --profile=htan \\
    --cred=~/.gen3/credentials.json \\
    --apiendpoint=https://nci-crdc.datacommons.io`}
                                </code>
                            </pre>
                        </li>
                    </ol>
                </>
                .
                <button
                    className="btn btn-light"
                    onClick={() =>
                        fileDownload(gen3manifestFile, GEN3_MANIFEST_FILENAME)
                    }
                >
                    <FontAwesomeIcon icon={faDownload} /> Download{' '}
                    <code>gen3_manifest.json</code>
                </button>
            </p>
            <p>
                Run the following <code>gen3</code> command.
                <pre className="pre-scrollable">
                    <pre
                        style={{
                            backgroundColor: '#f8f9fa',
                            padding: '10px',
                            borderRadius: '5px',
                        }}
                    >
                        <code>
                            {`gen3-client download-multiple \\
    --profile=htan \\
    --manifest=gen3_manifest.json \\
    --download_path=my_htan_dir`}
                        </code>
                    </pre>
                </pre>
            </p>
        </div>
    );
};

const CDSInstructions: React.FunctionComponent<{ files: Entity[] }> = ({
    files,
}) => {
    const dbgapFiles = files.filter(
        (f) => f.downloadSource === DownloadSourceCategory.dbgap
    );
    const openAccessFiles = files.filter(
        (f) => f.downloadSource !== DownloadSourceCategory.dbgap
    );

    const manifestFile = generateCdsManifestFile(files);
    const gen3manifestFile = generateGen3ManifestFile(files);

    return (
        <div>
            <hr />
            <h4>
                <strong>
                    Files Available through NCI CRDC Cancer Data Service (CDS)
                </strong>
            </h4>

            {/* Render dbGaP instructions if dbGaP files exist */}
            {dbgapFiles.length > 0 && (
                <div>
                    <p>
                        <FontAwesomeIcon color="#FF8C00" icon={faLock} /> Your
                        selection includes controlled-access Level 1 and/or
                        Level 2 sequencing data. To download Level 1/2
                        sequencing data, you first need to have been granted
                        access to the{' '}
                        <a
                            href="https://www.ncbi.nlm.nih.gov/projects/gap/cgi-bin/study.cgi?study_id=phs002371"
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            HTAN dbGaP Study, Accession: phs002371
                        </a>
                        .
                    </p>
                    <CDSFileList files={dbgapFiles} />
                </div>
            )}

            {/* Render open access instructions if open access files exist */}
            {openAccessFiles.length > 0 && (
                <div>
                    <p>
                        <FontAwesomeIcon color="#00796B" icon={faLockOpen} />{' '}
                        The files listed below are available without additional
                        access requirements.
                    </p>
                    <CDSFileList files={openAccessFiles} />
                </div>
            )}

            {/* CDS and Gen3 manifest instructions */}
            {cdsManifestInstructions(manifestFile)}
            {gen3ManifestInstructions(gen3manifestFile)}
        </div>
    );
};

const NotDownloadableInstructions: React.FunctionComponent<{
    files: Entity[];
}> = (props) => {
    const hasAnyImageViewersForNonDownloadableFiles = props.files.some(
        (f) => getImageViewersAssociatedWithFile(f).hasImageViewer
    );

    return props.files.length > 0 ? (
        <div>
            <h4>
                <strong>Files coming soon</strong>
            </h4>
            <p>Your selection includes data that is not downloadable yet:</p>

            {/* List the files */}
            <pre className="pre-scrollable">
                <code>
                    {props.files.map((f) => (
                        <div key={f.Filename}>
                            <FontAwesomeIcon icon={faHourglassStart} />{' '}
                            {getFileBase(f.Filename)}
                        </div>
                    ))}
                </code>
            </pre>

            {/* Additional message if files have preview viewers */}
            {hasAnyImageViewersForNonDownloadableFiles ? (
                <p>
                    These files are in preview. You can view metadata or explore
                    them in one of the viewers in the rightmost column while
                    they are prepared for public access.
                </p>
            ) : (
                <p>
                    These files are in preview. Metadata is available for review
                    while the files are prepared for public access.
                </p>
            )}
        </div>
    ) : null;
};

function generateDownloadScript(files: Entity[]) {
    const filesByName = _.groupBy(files, (f) => getFileBase(f.Filename));

    // append download location for files with identical names
    return files
        .map((f) => {
            const script = `synapse get ${f.synapseId}`;
            return filesByName[getFileBase(f.Filename)].length > 1
                ? `${script} --downloadLocation ${f.synapseId}`
                : script;
        })
        .join('\n');
}

const SynapseFileList: React.FunctionComponent<{
    files: Entity[];
}> = ({ files }) => {
    return (
        <pre className="pre-scrollable">
            <code>
                {files.map((file) => (
                    <div key={file.synapseId}>
                        <FontAwesomeIcon color="#00796B" icon={faLockOpen} />{' '}
                        {getFileBase(file.Filename)} (
                        <a
                            href={`https://www.synapse.org/#!Synapse:${file.synapseId}`}
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            {file.synapseId}
                        </a>
                        )
                    </div>
                ))}
            </code>
        </pre>
    );
};

const SynapseInstructions: React.FunctionComponent<{ files: Entity[] }> = (
    props
) => {
    const script = generateDownloadScript(props.files);

    return (
        <>
            <hr></hr>
            <h4>
                <strong>Files available in Synapse</strong>
            </h4>
            <p>
                The files listed below are available through{' '}
                <a href="https://synapse.org" target="_blank">
                    Synapse
                </a>
                .
            </p>
            <SynapseFileList files={props.files} />
            <p>
                You can use the{' '}
                <a
                    href="https://docs.synapse.org/articles/getting_started_clients.html"
                    target="_blank"
                >
                    Synapse CLI
                </a>{' '}
                command below to download the selected files.
            </p>
            <pre className="pre-scrollable">
                <code>{script}</code>
            </pre>
            <p>
                You'll need to{' '}
                <a
                    href="https://www.synapse.org/#!RegisterAccount:0"
                    target="_blank"
                >
                    register
                </a>{' '}
                for a Synapse account to be able to use the{' '}
                <a href="https://docs.synapse.org/articles/getting_started_clients.html">
                    client
                </a>
                . More information can be found in the{' '}
                <a
                    href="https://docs.synapse.org/articles/downloading_data.html"
                    target="_blank"
                >
                    Synapse documentation
                </a>
                . Files can also be downloaded manually through the Synapse web
                interface by clicking on the file name.
            </p>
        </>
    );
};

const FileDownloadModal: React.FunctionComponent<IFileDownloadModalProps> = (
    props
) => {
    const cdsFiles = props.files.filter((f) => f.viewers?.cds);
    const synapseFiles = props.files.filter(
        (f) => f.downloadSource === DownloadSourceCategory.synapse
    );
    const notDownloadableFiles = props.files.filter(
        (f) =>
            f.downloadSource?.includes(DownloadSourceCategory.comingSoon) ||
            (f.Component.startsWith('Imaging') &&
                (f.level === 'Level 1' || f.level == 'Level 2') &&
                !f.viewers?.cds)
    );

    const availabilityMessage = () => {
        const messages = [];
        if (cdsFiles.length > 0) {
            messages.push(
                'Available through NCI CRDC Cancer Data Service (CDS)'
            );
        }
        if (synapseFiles.length > 0) {
            messages.push('Available through Synapse');
        }
        if (notDownloadableFiles.length > 0) {
            messages.push('Coming soon (not downloadable yet)');
        }
        return messages;
    };

    return (
        <Modal show={props.isOpen} onHide={props.onClose}>
            <Modal.Header closeButton>
                <Modal.Title>Download Selected Files</Modal.Title>
            </Modal.Header>

            <Modal.Body>
                {/* Summary Section */}
                <p>Your selection include files that are:</p>
                <ul>
                    {availabilityMessage().map((message, index) => (
                        <li key={index}>{message}</li>
                    ))}
                </ul>
                <p>
                    Follow the instructions below on how to access data from
                    each of these sources. Further details are avaliable in the{' '}
                    <a href="docs.humantumoratlas.org">HTAN Manual</a>.
                </p>

                {/* CDS Section */}
                {cdsFiles.length > 0 && <CDSInstructions files={cdsFiles} />}

                {/* Synapse Section */}
                {synapseFiles.length > 0 && (
                    <SynapseInstructions files={synapseFiles} />
                )}

                {/* Not Downloadable Section */}
                {notDownloadableFiles.length > 0 && (
                    <NotDownloadableInstructions files={notDownloadableFiles} />
                )}
            </Modal.Body>

            <Modal.Footer>
                <Button variant="secondary" onClick={props.onClose}>
                    Close
                </Button>
            </Modal.Footer>
        </Modal>
    );
};

const CellViewerLink: React.FunctionComponent<{
    name: string;
    url: string;
    style?: CSSProperties;
}> = (props) => {
    const style = props.style || { paddingRight: 5 };

    return (
        <a href={props.url} target="_blank" style={style}>
            {props.name} <FontAwesomeIcon icon={faExternalLinkAlt} />
        </a>
    );
};

type ImageViewerInfo = {
    minervaUrl?: string;
    ucscXenaUrl?: string;
    hasCustomStory: boolean;
    hasImageViewer: boolean;
    thumbnailUrl?: string;
    autogeneratedImageInfo: any;
    idcImageUrl: string | undefined;
    idcImageBucketAwsUrl: string | undefined;
    idcImageBucketGcpUrl: string | undefined;
};

function getImageViewersAssociatedWithFile(file: Entity): ImageViewerInfo {
    // check if image is in IDC
    let idcImageUrl = undefined;
    let idcImageBucketAwsUrl = undefined;
    let idcImageBucketGcpUrl = undefined;

    if (file.viewers?.idc) {
        idcImageUrl = file.viewers.idc.viewer_url;
        idcImageBucketAwsUrl = file.viewers.idc.s5cmd_manifest_aws;
        idcImageBucketGcpUrl = file.viewers.idc.s5cmd_manifest_gcp;
    }

    const ucscXenaUrl = file.viewers?.ucscXena;

    // custom submitted minerva stories (w/o thumbnails)
    const minervaCustomStoryLink = file.viewers?.customMinerva;
    // auto generated minerva stories and thumbnails
    const autogeneratedImageInfo = file.viewers?.autoMinerva;
    const thumbnailUrl =
        autogeneratedImageInfo && autogeneratedImageInfo.thumbnail;
    let minervaUrl;
    const hasCustomStory = !!minervaCustomStoryLink;
    if (hasCustomStory) {
        // if somebody submitted a custom Minerva Story use
        // that, instead of the auto generated one
        minervaUrl = minervaCustomStoryLink;
    } else {
        minervaUrl = autogeneratedImageInfo && autogeneratedImageInfo.minerva;
        // hide CyCIF in introductory text by appending #s=0 to minerva story URL
        minervaUrl = minervaUrl && `${minervaUrl}#s=0`;
    }

    return {
        minervaUrl,
        thumbnailUrl,
        ucscXenaUrl,
        autogeneratedImageInfo,
        hasCustomStory,
        // has a viewer of there is a minerva link either custom or auto
        // generated
        hasImageViewer: !!minervaUrl /*|| idcImageUrl !== undefined*/,
        idcImageUrl,
        idcImageBucketAwsUrl,
        idcImageBucketGcpUrl,
    };
}

interface IFileTableProps {
    entities: Entity[];
    groupsByPropertyFiltered: GroupsByProperty<Entity>;
    patientCount: number;
    publicationsByUid?: { [uid: string]: PublicationManifest };
    enableLevelFilter?: boolean; // Add or hide "Level" filter above table
}

@observer
export class FileTable extends React.Component<IFileTableProps> {
    @observable.ref selected: Entity[] = [];
    @observable clicked: Entity | undefined;
    @observable isDownloadModalOpen = false;
    @observable isLinkOutModalOpen = false;
    @observable viewDetailsFile: Entity | undefined = undefined;
    @observable columnVisibility: { [columnKey: string]: boolean } = {};
    @observable selectedLevels: string[] = this.allLevels;

    getDownloadButton(
        disabledText: string,
        style?: React.CSSProperties
    ): JSX.Element {
        return (
            <button
                className={classNames(
                    'btn',
                    this.hasFilesSelected ? 'btn-primary' : 'btn-secondary'
                )}
                disabled={!this.hasFilesSelected}
                onMouseDown={this.onDownload}
                style={style}
            >
                {this.hasFilesSelected ? (
                    <>
                        <FontAwesomeIcon icon={faDownload} />{' '}
                        {`Download ${this.selected.length} selected ${
                            this.selected.length === 1 ? 'file' : 'files'
                        }`}
                    </>
                ) : (
                    disabledText
                )}
            </button>
        );
    }

    get defaultColumns(): IEnhancedDataTableColumn<Entity>[] {
        return [
            {
                name: 'Filename',
                selector: 'Filename',
                wrap: true,
                sortable: true,
                grow: 1.4,
                cell: (file: Entity) => {
                    const truncatedFilename = truncateFilename(file.Filename);
                    const linkOut =
                        file.downloadSource ===
                        DownloadSourceCategory.synapse ? (
                            <a
                                target="_blank"
                                href={`https://www.synapse.org/#!Synapse:${file.synapseId}`}
                            >
                                {truncatedFilename}
                            </a>
                        ) : (
                            <span
                                className={commonStyles.clickable}
                                onClick={(e) => this.onClick(e, file)}
                            >
                                {truncatedFilename}
                            </span>
                        );

                    return (
                        <Tooltip
                            overlay={
                                <span className={styles.filenameTooltipContent}>
                                    {getFileBase(file.Filename)}
                                </span>
                            }
                        >
                            {linkOut}
                        </Tooltip>
                    );
                },
            },
            {
                name: 'Atlas Name',
                selector: 'atlas_name',
                wrap: true,
                sortable: true,
            },
            getPublicationColumn(this.props.publicationsByUid),
            {
                name: 'Biospecimen',
                selector: (file: Entity) => {
                    return _.uniq(file.biospecimenIds).join(', ');
                },
                cell: (file: Entity) => {
                    const uniqueBiospecimens = _.uniq(file.biospecimenIds);
                    if (uniqueBiospecimens.length === 0) {
                        return '0 Biospecimens';
                    } else if (uniqueBiospecimens.length === 1) {
                        return uniqueBiospecimens[0];
                    } else {
                        return (
                            <Tooltip
                                overlay={
                                    <SimpleScrollPane
                                        width={150}
                                        height={150}
                                        style={{
                                            background: 'white',
                                            color: 'black',
                                            padding: '5px 10px 5px 10px',
                                        }}
                                    >
                                        {interleave(uniqueBiospecimens, <br />)}
                                    </SimpleScrollPane>
                                }
                            >
                                <span>
                                    {uniqueBiospecimens.length} Biospecimens
                                </span>
                            </Tooltip>
                        );
                    }
                },
                wrap: true,
                sortable: true,
            },
            {
                name: 'Assay',
                selector: FileAttributeMap[AttributeNames.assayName].path,
                wrap: true,
                sortable: true,
            },
            {
                name: 'Level',
                selector: 'level',
                wrap: true,
                sortable: true,
            },
            {
                name: 'Organ',
                selector: (file: Entity) => {
                    return file.TissueorOrganofOrigin.join(', ');
                },
                cell: truncatedTableCell,
                wrap: true,
                sortable: true,
            },
            {
                name: 'Treatment',
                selector: (file: Entity) => {
                    return file.TreatmentType.join(', ');
                },
                cell: truncatedTableCell,
                wrap: true,
                sortable: true,
                omit: true,
            },
            {
                name: 'Diagnosis',
                selector: (file: Entity) => {
                    return file.PrimaryDiagnosis.join(', ');
                },
                cell: truncatedTableCell,
                wrap: true,
                sortable: true,
            },
            {
                name: 'Data Access',
                selector: 'downloadSource',
                wrap: true,
                sortable: true,
            },
            {
                name: DETAILS_COLUMN_NAME,
                selector: (file: Entity) => 'Details',
                cell: (file: Entity) => {
                    if (true) {
                        // TODO: determine if there are more details
                        return (
                            <a
                                href={'#'}
                                onClick={action(() => {
                                    this.viewDetailsFile = file;
                                })}
                            >
                                View Metadata
                            </a>
                        );
                    }
                },
                wrap: true,
                sortable: false,
                searchable: false,
            },
            {
                name: 'View',
                cell: (file: Entity) => {
                    addViewers(file);

                    const cellXGeneLink = file.viewers?.cellxgene;
                    const ucscXenaLink = file.viewers?.ucscXena;
                    const bigQueryLink = file.viewers?.isbcgc;
                    const imageViewers = getImageViewersAssociatedWithFile(
                        file
                    );

                    const cellViewers: JSX.Element[] = [];
                    if (cellXGeneLink) {
                        cellViewers.push(
                            <CellViewerLink
                                name="CellxGene"
                                url={cellXGeneLink}
                            />
                        );
                    }
                    if (ucscXenaLink) {
                        cellViewers.push(
                            <CellViewerLink
                                name="UCSC Xena"
                                url={ucscXenaLink}
                            />
                        );
                    }
                    if (bigQueryLink) {
                        cellViewers.push(
                            <CellViewerLink
                                name="BigQuery"
                                url={bigQueryLink}
                            />
                        );
                    }

                    if (
                        file.Component.startsWith('Imaging') ||
                        file.Component.toLowerCase().includes('visium')
                    ) {
                        if (
                            imageViewers.autogeneratedImageInfo &&
                            imageViewers.thumbnailUrl
                        ) {
                            return (
                                <div className={styles.dsaContainer}>
                                    <Tooltip
                                        placement="left"
                                        overlay={
                                            <>
                                                <div
                                                    style={{
                                                        textAlign: 'center',
                                                    }}
                                                >
                                                    {imageViewers.hasImageViewer &&
                                                        'View Image in '}
                                                    {imageViewers.minervaUrl && (
                                                        <CellViewerLink
                                                            name="Minerva"
                                                            url={
                                                                imageViewers.minervaUrl
                                                            }
                                                            style={{
                                                                color: 'white',
                                                            }}
                                                        />
                                                    )}
                                                    {imageViewers.ucscXenaUrl && (
                                                        <>
                                                            {' or '}
                                                            <CellViewerLink
                                                                name="UCSC Xena"
                                                                url={
                                                                    imageViewers.ucscXenaUrl
                                                                }
                                                                style={{
                                                                    color:
                                                                        'white',
                                                                }}
                                                            />
                                                        </>
                                                    )}
                                                    {/*imageViewers.minervaUrl &&
                                                        imageViewers.idcImageUrl &&
                                                        ' or '
                                                    */}
                                                    {/*imageViewers.idcImageUrl && (
                                                        <CellViewerLink name="IDC" url={imageViewers.idcImageUrl} style={{color: 'white'}} />
                                                    )*/}
                                                    {!imageViewers.hasImageViewer && (
                                                        <CellViewerLink
                                                            name={
                                                                'Click to view Thumbnail'
                                                            }
                                                            url={
                                                                imageViewers.thumbnailUrl
                                                            }
                                                            style={{
                                                                color: 'white',
                                                            }}
                                                        />
                                                    )}
                                                </div>
                                                <a
                                                    href={
                                                        imageViewers.minervaUrl
                                                    }
                                                    target="_blank"
                                                >
                                                    <img
                                                        className={
                                                            styles.dsaFullImage
                                                        }
                                                        src={
                                                            imageViewers.thumbnailUrl
                                                        }
                                                    />
                                                </a>
                                                {file.assayName !== 'H&E' && (
                                                    <span>
                                                        Thumbnail generated with{' '}
                                                        <CellViewerLink
                                                            name="Miniature"
                                                            url="https://github.com/adamjtaylor/miniature"
                                                            style={{
                                                                color: 'white',
                                                            }}
                                                        />
                                                    </span>
                                                )}
                                                {file.imageChannelMetadata && (
                                                    <div
                                                        style={{
                                                            textAlign: 'center',
                                                        }}
                                                    >
                                                        <CellViewerLink
                                                            name="Download Channel Metadata"
                                                            url={`https://www.synapse.org/#!Synapse:${file.imageChannelMetadata.synapseId}.${file.imageChannelMetadata.version}`}
                                                            style={{
                                                                color: 'white',
                                                            }}
                                                        />
                                                    </div>
                                                )}
                                            </>
                                        }
                                    >
                                        <div>
                                            <a
                                                href={
                                                    imageViewers.minervaUrl ||
                                                    imageViewers.thumbnailUrl
                                                }
                                                target="_blank"
                                            >
                                                <img
                                                    className={
                                                        commonStyles.dsaThumb
                                                    }
                                                    src={
                                                        imageViewers.thumbnailUrl
                                                    }
                                                />
                                            </a>
                                            <br />
                                            {/*minervaStoryUrl && (
                                                <a href={minervaStoryUrl} target="_blank">
                                                    Minerva Story{' '}
                                                    <FontAwesomeIcon icon={faExternalLinkAlt} />
                                                </a>
                                            )*/}
                                        </div>
                                    </Tooltip>
                                </div>
                            );
                        } else if (imageViewers.hasImageViewer) {
                            return (
                                <>
                                    {imageViewers.minervaUrl && (
                                        <CellViewerLink
                                            name="Minerva"
                                            url={imageViewers.minervaUrl}
                                        />
                                    )}
                                    {/*imageViewers.idcImageUrl && (
                                        <CellViewerLink name="IDC" url={imageViewers.idcImageUrl} />
                                    )*/}
                                </>
                            );
                        }
                    }

                    if (cellViewers.length > 0) {
                        return cellViewers;
                    } else if (file.Component.startsWith('ImagingLevel2')) {
                        return 'Image Viewer Coming Soon';
                    } else {
                        return '';
                    }
                },
                selector: (file) => getViewerValues(file),
                wrap: true,
                sortable: true,
            },
        ];
    }

    get otherColumns() {
        const otherSelectors = this.props.entities.reduce((selectors, file) => {
            for (const key of Object.keys(file)) {
                selectors[key] = true;
            }
            return selectors;
        }, {} as { [selector: string]: boolean });

        const excludeFromOtherColumns = {
            // selectors already used in default columns
            Filename: true,
            biospecimen: true,
            atlas_name: true,
            [FileAttributeMap[AttributeNames.assayName].path!]: true,
            level: true,
            diagnosis: true,
            primaryParents: true,
            downloadSource: true,
            viewers: true,
            imageChannelMetadata: true,
            therapy: true,
            publicationIds: true,
            TreatmentType: true,
            TissueorOrganofOrigin: true,

            // duplicate fields which are only added for filtering purposes
            Gender: true,
            Race: true,
            Ethnicity: true,
            VitalStatus: true,

            //others to exclude
            Component: true,
            AtlasMeta: true,
            biospecimenIds: true,
            cases: true,
            demographics: true,
            demographicsIds: true,
            diagnosisIds: true,
            therapyIds: true,
        };

        const listSelectors: any = {
            [GenericAttributeNames.ParentDataFileID]: {
                pluralName: 'Files',
            },
        };
        const otherColumns = Object.keys(otherSelectors).reduce(
            (columns, selector) => {
                if (!(selector in excludeFromOtherColumns)) {
                    if (selector in listSelectors) {
                        columns.push(
                            makeListColumn(
                                selector as keyof Entity,
                                listSelectors[selector].pluralName
                            )
                        );
                    } else {
                        columns.push({
                            name: selectorToColumnName(selector),
                            selector,
                            wrap: true,
                            sortable: true,
                        });
                    }
                }
                return columns;
            },
            [] as IEnhancedDataTableColumn<Entity>[]
        );

        return otherColumns;
    }

    get allLevels() {
        return _.chain(this.props.entities)
            .map((e) => e.level)
            .uniq()
            .value();
    }

    get columns() {
        return _.sortBy(
            [...this.defaultColumns, ...this.otherColumns],
            (column) => {
                switch (column.name) {
                    // sort Details and View to the end
                    case DETAILS_COLUMN_NAME:
                        return 1;
                    case 'View':
                        return 2;
                    default:
                        return 0;
                }
            }
        );
    }

    get filteredEntities() {
        return this.props.enableLevelFilter
            ? _.chain(this.props.entities)
                  .filter((e) => this.selectedLevels.includes(e.level))
                  .value()
            : this.props.entities;
    }

    constructor(props: IFileTableProps) {
        super(props);
        makeObservable(this);

        const columnVisibilityMap = _.mapValues(
            _.keyBy(
                this.defaultColumns,
                (c: IEnhancedDataTableColumn<Entity>) => c.name
            ),
            (c: IEnhancedDataTableColumn<Entity>) => !c.omit
        );

        this.columnVisibility = columnVisibilityMap;
    }

    @action.bound
    setColumnVisibility(vis: { [key: string]: boolean }) {
        this.columnVisibility = vis;
    }

    @action.bound
    setSelectedLevels(levels: string[]) {
        this.selectedLevels = levels;
    }

    @action onDownload = (e: any) => {
        e.preventDefault();
        this.isDownloadModalOpen = true;
    };

    @action onClick = (e: any, file: Entity) => {
        e.preventDefault();
        this.clicked = file;
        this.isLinkOutModalOpen = true;
    };

    @action onDownloadModalClose = () => {
        this.isDownloadModalOpen = false;
    };

    @action onLinkOutModalClose = () => {
        this.isLinkOutModalOpen = false;
    };

    @action onViewDetailsModalClose = () => {
        this.viewDetailsFile = undefined;
    };

    onSelect = (state: {
        allSelected: boolean;
        selectedCount: number;
        selectedRows: Entity[];
    }) => {
        this.selected = state.selectedRows;
    };

    get hasFilesSelected() {
        return this.selected.length > 0;
    }

    render() {
        return this.props.entities ? (
            <>
                <FileDownloadModal
                    files={this.selected}
                    onClose={this.onDownloadModalClose}
                    isOpen={this.isDownloadModalOpen}
                />

                <FileDownloadModal
                    files={this.clicked ? [this.clicked] : []}
                    onClose={this.onLinkOutModalClose}
                    isOpen={this.isLinkOutModalOpen}
                />

                <ViewDetailsModal
                    cellData={this.viewDetailsFile}
                    onClose={this.onViewDetailsModalClose}
                    columnVisibility={this.columnVisibility}
                    onChangeColumnVisibility={this.setColumnVisibility}
                    columns={this.columns.filter(
                        (c) => c.name !== DETAILS_COLUMN_NAME
                    )}
                />

                <EnhancedDataTable
                    columnVisibility={this.columnVisibility}
                    onChangeColumnVisibility={this.setColumnVisibility}
                    customControls={this.getDownloadButton(
                        'Select files to download below'
                    )}
                    extraControlsInsideDataTableControls={
                        this.props.enableLevelFilter ? (
                            <LevelSelect
                                allLevels={this.allLevels}
                                selectedLevels={this.selectedLevels}
                                onLevelToggled={this.setSelectedLevels}
                            />
                        ) : undefined
                    }
                    paginationServerOptions={{
                        persistSelectedOnPageChange: false,
                        persistSelectedOnSort: false,
                    }}
                    columns={this.columns}
                    additionalSearchFilter={(
                        e: Entity,
                        t: string,
                        tUpperCase: string
                    ) => {
                        return _.some(e.diagnosis, (d) =>
                            d.ParticipantID.toUpperCase().includes(tUpperCase)
                        );
                    }}
                    data={this.filteredEntities}
                    striped={true}
                    dense={false}
                    selectableRows={true}
                    onSelectedRowsChange={this.onSelect}
                    pagination={true}
                    paginationPerPage={50}
                    paginationRowsPerPageOptions={[10, 20, 50, 100, 500]}
                    noHeader={true}
                    subHeader={false}
                    customStyles={getDefaultDataTableStyle()}
                />

                {this.getDownloadButton('Select files to download above', {
                    marginTop: -70,
                })}
            </>
        ) : null;
    }
}

export default FileTable;
