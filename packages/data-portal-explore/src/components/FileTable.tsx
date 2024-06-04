import fileDownload from 'js-file-download';
import { action, computed, makeObservable, observable } from 'mobx';
import { observer } from 'mobx-react';
import React, { CSSProperties, useState } from 'react';
import { Button, Form, Modal } from 'react-bootstrap';
import Tooltip from 'rc-tooltip';
import _ from 'lodash';
import classNames from 'classnames';
import {
    faDownload,
    faExternalLinkAlt,
    faLockOpen,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import { truncatedTableCell } from '../lib/dataTableHelpers';
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
    commonStyles,
    DownloadSourceCategory,
    Entity,
    FileAttributeMap,
    getViewerValues,
    ViewDetailsModal,
} from '@htan/data-portal-commons';

const CDS_MANIFEST_FILENAME = 'cds_manifest.csv';

interface IFileDownloadModalProps {
    files: Entity[];
    onClose: () => void;
    isOpen: boolean;
}

const DETAILS_COLUMN_NAME = 'Metadata';

function generateCdsManifestFile(files: Entity[]): string | undefined {
    const columns = ['drs_uri', 'name'];
    const data = _(files)
        .map((f) => f.viewers?.cds)
        .compact()
        .map((asset) => [asset.drs_uri, asset.name])
        .value();

    if (data.length > 0) {
        return [columns, ...data].map((row) => row.join(',')).join('\n');
    } else {
        return undefined;
    }
}

const FilenameWithAccessIcon: React.FunctionComponent<{
    file: Entity;
}> = (props) => {
    return (
        <>
            {props.file.downloadSource === DownloadSourceCategory.dbgap ? (
                '🔒'
            ) : (
                <FontAwesomeIcon color="#1adb54" icon={faLockOpen} />
            )}{' '}
            {getFileBase(props.file.Filename)}
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

const CDSInstructions: React.FunctionComponent<{
    files: Entity[];
}> = (props) => {
    const manifestFile = generateCdsManifestFile(props.files);
    const dbgapFiles = props.files.filter(
        (f) => f.downloadSource === DownloadSourceCategory.dbgap
    );

    const manifestInstructions = (
        <>
            you can import this manifest file into CGC following the
            instructions{' '}
            <a
                href="https://docs.cancergenomicscloud.org/docs/import-from-a-drs-server#import-from-a-manifest-file"
                target="_blank"
            >
                here
            </a>
            .
        </>
    );

    const dbgapInstructions = (
        <>
            <p>
                Your selection includes Level 1 and/or Level 2 sequencing data
                (🔒):
            </p>
            <CDSFileList files={props.files} />
            <p>
                To download Level 1/2 sequencing data you first need to request{' '}
                <a
                    href="https://www.ncbi.nlm.nih.gov/projects/gap/cgi-bin/study.cgi?study_id=phs002371"
                    target="_blank"
                >
                    dbGaP
                </a>{' '}
                access. Afterwards {manifestInstructions}
            </p>
        </>
    );

    const openAccessInstructions = (
        <>
            <CDSFileList files={props.files} />
            <p>To download selected files {manifestInstructions}</p>
        </>
    );

    return (
        <>
            {dbgapFiles.length > 0 && dbgapInstructions}
            {dbgapFiles.length === 0 && openAccessInstructions}
            {manifestFile?.length && (
                <p>
                    <button
                        className="btn btn-light"
                        onClick={() =>
                            fileDownload(manifestFile, CDS_MANIFEST_FILENAME)
                        }
                    >
                        <FontAwesomeIcon icon={faDownload} /> Download Manifest
                    </button>
                </p>
            )}
        </>
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
            <p>Your selection includes data that is not downloadable yet:</p>
            <pre className="pre-scrollable">
                <code>
                    {props.files.map((f) => getFileBase(f.Filename)).join('\n')}
                </code>
            </pre>
            {hasAnyImageViewersForNonDownloadableFiles && (
                <span>
                    Note however that you can explore them in one of the viewers
                    in the right most column.
                </span>
            )}
        </div>
    ) : null;
};

const ImagingInstructionsIDC: React.FunctionComponent<{ files: Entity[] }> = (
    props
) => {
    const [cloudSource, setCloudSource] = useState<'gcp' | 'aws'>('gcp');
    const getImageBucketUrl = (info: ImageViewerInfo) => {
        return cloudSource === 'gcp'
            ? info.idcImageBucketGcpUrl
            : info.idcImageBucketAwsUrl;
    };

    const idcImageBucketUrls: string[] = props.files
        .map(
            (f) => getImageBucketUrl(getImageViewersAssociatedWithFile(f)) || []
        )
        .flat();
    const filesNotDownloadableFromIDC: Entity[] = props.files.filter(
        (f) =>
            getImageBucketUrl(getImageViewersAssociatedWithFile(f)) ===
            undefined
    );

    return (
        <>
            {idcImageBucketUrls.length > 0 && (
                <div>
                    <p>
                        Imaging data is available in{' '}
                        <a
                            href="https://learn.canceridc.dev/dicom/dicom-tiff-dual-personality-files"
                            target="_blank"
                        >
                            DICOM-TIFF format
                        </a>{' '}
                        from the{' '}
                        <a
                            href="https://imaging.datacommons.cancer.gov/explore/"
                            target="_blank"
                        >
                            Imaging Data Commons (IDC)
                        </a>
                    </p>
                    <p>
                        Cloud source:{' '}
                        <Form>
                            <Form.Group>
                                <Form.Check
                                    onChange={() => setCloudSource('gcp')}
                                    type="radio"
                                    label={
                                        'GCP - sponsored by Google Public Data Program'
                                    }
                                    checked={cloudSource === 'gcp'}
                                />
                                <Form.Check
                                    onChange={() => setCloudSource('aws')}
                                    type="radio"
                                    label={
                                        'AWS - sponsored by AWS Open Data Sponsorship Program'
                                    }
                                    checked={cloudSource === 'aws'}
                                />
                            </Form.Group>
                        </Form>
                    </p>
                    <p>
                        To download the images in this manifest,{' '}
                        <a
                            href={'https://github.com/peak/s5cmd#installation'}
                            target="_blank"
                        >
                            install s5cmd
                        </a>
                        , then run the following command:
                    </p>
                    <p>
                        <strong>
                            s5cmd --no-sign-request --endpoint-url{' '}
                            {cloudSource === 'gcp'
                                ? 'https://storage.googleapis.com'
                                : 'https://s3.amazonaws.com'}{' '}
                            run manifest.txt
                        </strong>
                    </p>
                    <p>
                        You can use the below bucket URLs for the{' '}
                        <code>manifest.txt</code> file:
                    </p>
                    <pre className="pre-scrollable">
                        <code>{idcImageBucketUrls.join('\n')}</code>
                    </pre>
                </div>
            )}
            <NotDownloadableInstructions files={filesNotDownloadableFromIDC} />
        </>
    );
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

const SynapseInstructions: React.FunctionComponent<{ files: Entity[] }> = (
    props
) => {
    const script = generateDownloadScript(props.files);

    return (
        <>
            <p>
                Use the{' '}
                <a
                    href="https://docs.synapse.org/articles/getting_started_clients.html"
                    target="_blank"
                >
                    Synapse command line client
                </a>{' '}
                to download the selected files:
            </p>
            <pre className="pre-scrollable">
                <code>{script}</code>
            </pre>
            <p>
                It is required to{' '}
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
                .
            </p>
            <p>
                Note that the files can also be downloaded manually through the
                Synapse web interface by clicking on the file name.
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

    return (
        <Modal show={props.isOpen} onHide={props.onClose}>
            <Modal.Header closeButton>
                <Modal.Title>Download Selected Files</Modal.Title>
            </Modal.Header>

            <Modal.Body>
                {cdsFiles.length > 0 && <CDSInstructions files={cdsFiles} />}
                {notDownloadableFiles.length > 0 && (
                    <NotDownloadableInstructions files={notDownloadableFiles} />
                )}
                {synapseFiles.length > 0 && (
                    <SynapseInstructions files={synapseFiles} />
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
    groupsByPropertyFiltered: {
        [attrName: string]: { [attrValue: string]: Entity[] };
    };
    patientCount: number;
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
                        <Tooltip overlay={getFileBase(file.Filename)}>
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
            {
                name: 'Biospecimen',
                selector: (file: Entity) => {
                    return _.uniq(
                        file.biospecimen.map((b) => b.BiospecimenID)
                    ).join(', ');
                },
                cell: (file: Entity) => {
                    const uniqueBiospecimens = _.uniq(
                        file.biospecimen.map((b) => b.BiospecimenID)
                    );
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
                    return _.uniq(
                        file.diagnosis.map((d) => d.TissueorOrganofOrigin)
                    ).join(', ');
                },
                cell: truncatedTableCell,
                wrap: true,
                sortable: true,
            },
            {
                name: 'Diagnosis',
                selector: (file: Entity) => {
                    return _.uniq(
                        file.diagnosis.map((d) => d.PrimaryDiagnosis)
                    ).join(', ');
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

            //others to exclude
            Component: true,
            AtlasMeta: true,
            biospecimenIds: true,
            cases: true,
            demographics: true,
            demographicsIds: true,
            diagnosisIds: true,
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

    @computed get columns() {
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

    @computed get filteredEntities() {
        return this.props.enableLevelFilter
            ? _.chain(this.props.entities)
                  .filter((e) => this.selectedLevels.includes(e.level))
                  .value()
            : this.props.entities;
    }

    constructor(props: IFileTableProps) {
        super(props);
        makeObservable(this);

        this.columnVisibility = _.mapValues(
            _.keyBy(this.defaultColumns, (c) => c.name),
            () => true
        );
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

    @computed get hasFilesSelected() {
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
