import { action, computed, makeObservable, observable } from 'mobx';
import { observer } from 'mobx-react';
import React from 'react';
import { Button, Modal, Table } from 'react-bootstrap';
import Tooltip from 'rc-tooltip';
import _ from 'lodash';
import classNames from 'classnames';
import {
    faDownload,
    faExternalLinkAlt,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import {
    Atlas,
    doesFileIncludeLevel1OrLevel2SequencingData,
    Entity,
    getFileBase,
    selectorToColumnName,
    truncateFilename,
} from '../lib/helpers';
import {
    getDefaultDataTableStyle,
    truncatedTableCell,
} from '../lib/dataTableHelpers';
import EnhancedDataTable, {
    IEnhancedDataTableColumn,
} from './EnhancedDataTable';
import { AttributeMap, AttributeNames } from '../lib/types';
import SimpleScrollPane from './SimpleScrollPane';
import interleave from '../lib/interleave';
import styles from './common.module.scss';
import { faPlusCircle } from '@fortawesome/free-solid-svg-icons';
import { returnStatement } from '@babel/types';
import { makeListColumn } from '../lib/fileTableHelpers';

const CELLXGENE_MAPPINGS = require('../data/cellxgene-mappings.json');
const ISBCGC_MAPPINGS = require('../data/isbcgc-mappings.json');
const CUSTOM_MINERVA_STORY_MAPPINGS = require('../data/minerva-story-mappings.json');
const THUMBNAIL_AND_AUTOMINERVA_MAPPINGS = require('../data/htan-imaging-assets.json');
const IDC_MAPPINGS = require('../data/idc-imaging-assets.json');

interface IFileDownloadModalProps {
    files: Entity[];
    onClose: () => void;
    isOpen: boolean;
}

interface IViewDetailsModalProps {
    file: Entity | undefined;
    onClose: () => void;
    columns: IEnhancedDataTableColumn<Entity>[];
    columnVisibility: { [columnKey: string]: boolean };
    onChangeColumnVisibility: (columnVisibility: {
        [columnKey: string]: boolean;
    }) => void;
}

const DETAILS_COLUMN_NAME = 'Details';

const CDSInstructions: React.FunctionComponent<{ files: Entity[] }> = (
    props
) => {
    return (
        <>
            <p>
                Your selection includes Level 1 and/or Level 2 sequencing data:
            </p>
            <pre className="pre-scrollable">
                <code>
                    {props.files.map((f) => getFileBase(f.filename)).join('\n')}
                </code>
            </pre>
            <p>
                These are currently only available through{' '}
                <a
                    href="https://www.ncbi.nlm.nih.gov/projects/gap/cgi-bin/study.cgi?study_id=phs002371.v1.p1"
                    target="_blank"
                >
                    {' '}
                    dbGaP{' '}
                </a>
                .
            </p>
        </>
    );
};

const ImagingInstructions: React.FunctionComponent<{ files: Entity[] }> = (
    props
) => {
    const idcImageBucketUrls: string[] = props.files
        .map(
            (f) => getImageViewersAssociatedWithFile(f).idcImageBucketUrls || []
        )
        .flat();
    const filesNotDownloadableFromIDC: Entity[] = props.files.filter(
        (f) =>
            getImageViewersAssociatedWithFile(f).idcImageBucketUrls ===
            undefined
    );
    const hasAnyImageViewersForNonDownloadbleFiles = filesNotDownloadableFromIDC.some(
        (f) => getImageViewersAssociatedWithFile(f).hasImageViewer
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
                        . See the{' '}
                        <a
                            href="https://learn.canceridc.dev/data/downloading-data"
                            target="_blank"
                        >
                            download instructions
                        </a>
                        .
                    </p>
                    <p>
                        HTAN's imaging dataset is part of Google's Public Data
                        Program (PDP) meaning download costs are covered by
                        Google. However, if you do provide a project ID it will
                        be charged (you can unset it with{' '}
                        <code>gcloud config unset project</code>).
                    </p>
                    <p>
                        If you already have the{' '}
                        <a
                            href="https://cloud.google.com/sdk/docs/install"
                            target="_blank"
                        >
                            Google Cloud CLI
                        </a>{' '}
                        installed you can start from{' '}
                        <a
                            href="https://learn.canceridc.dev/data/downloading-data#step-2-download-the-files-defined-by-the-manifest"
                            target="_blank"
                        >
                            step 2
                        </a>{' '}
                        in the download instructions and use the below bucket
                        URLs for the <code>manifest.txt</code> file:
                    </p>
                    <pre className="pre-scrollable">
                        <code>{idcImageBucketUrls.join('\n')}</code>
                    </pre>
                </div>
            )}
            {filesNotDownloadableFromIDC.length > 0 && (
                <div>
                    <p>
                        Your selection includes imaging data that is not
                        downloadable yet:
                    </p>
                    <pre className="pre-scrollable">
                        <code>
                            {props.files
                                .map((f) => getFileBase(f.filename))
                                .join('\n')}
                        </code>
                    </pre>
                    {hasAnyImageViewersForNonDownloadbleFiles && (
                        <span>
                            Note however that you can explore them in one of the
                            viewers in the right most column.
                        </span>
                    )}
                </div>
            )}
        </>
    );
};

const SynapseInstructions: React.FunctionComponent<{ files: Entity[] }> = (
    props
) => {
    const script = props.files
        .map((f) => `synapse get ${f.synapseId}`)
        .join('\n');

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
    const cdsFiles = props.files.filter(
        doesFileIncludeLevel1OrLevel2SequencingData
    );
    const synapseFiles = props.files.filter(
        (f) =>
            !doesFileIncludeLevel1OrLevel2SequencingData(f) &&
            !f.Component.startsWith('Imaging')
    );
    const imagingFiles = props.files.filter((f) =>
        f.Component.startsWith('Imaging')
    );

    return (
        <Modal show={props.isOpen} onHide={props.onClose}>
            <Modal.Header closeButton>
                <Modal.Title>Download Selected Files</Modal.Title>
            </Modal.Header>

            <Modal.Body>
                {cdsFiles.length > 0 && <CDSInstructions files={cdsFiles} />}
                {imagingFiles.length > 0 && (
                    <ImagingInstructions files={imagingFiles} />
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

function renderCell(column: IEnhancedDataTableColumn<Entity>, file: Entity) {
    if (column.cell) {
        return (column.cell as any)(file);
    } else if (typeof column.selector === 'string') {
        return _.get(file, column.selector);
    } else if (column.selector) {
        return (column.selector as any)(file);
    }
}

const ViewDetailsModal: React.FunctionComponent<IViewDetailsModalProps> = (
    props
) => {
    if (!props.file) {
        return null;
    }
    return (
        <Modal
            dialogClassName={styles.fileTableViewDetailsModal}
            show={props.file !== undefined}
            onHide={props.onClose}
        >
            <Modal.Header closeButton>
                <Modal.Title>Details</Modal.Title>
            </Modal.Header>

            <Modal.Body>
                <table className="table table-bordered">
                    <colgroup>
                        <col style={{ width: '20%' }} />
                        <col style={{ width: '80%' }} />
                    </colgroup>
                    <tbody>
                        {props.columns.reduce((rows, column) => {
                            const cell = renderCell(column, props.file!);
                            if (cell) {
                                rows.push(
                                    <tr key={column.name as string}>
                                        <td>
                                            {column.name}
                                            {!props.columnVisibility[
                                                column.name as string
                                            ] && (
                                                <Tooltip
                                                    overlay={
                                                        <span>
                                                            Add this column to
                                                            the table
                                                        </span>
                                                    }
                                                >
                                                    <span
                                                        style={{
                                                            color: 'green',
                                                            marginLeft: 3,
                                                            cursor: 'pointer',
                                                        }}
                                                        onClick={() =>
                                                            props.onChangeColumnVisibility(
                                                                {
                                                                    ...props.columnVisibility,
                                                                    [column.name as string]: true,
                                                                }
                                                            )
                                                        }
                                                    >
                                                        <FontAwesomeIcon
                                                            icon={faPlusCircle}
                                                        />
                                                    </span>
                                                </Tooltip>
                                            )}
                                        </td>
                                        <td>{cell}</td>
                                    </tr>
                                );
                            }
                            return rows;
                        }, [] as any[])}
                    </tbody>
                </table>
            </Modal.Body>

            <Modal.Footer>
                <Button variant="secondary" onClick={props.onClose}>
                    Close
                </Button>
            </Modal.Footer>
        </Modal>
    );
};

type ImageViewerInfo = {
    minervaUrl: string;
    hasCustomStory: boolean;
    hasImageViewer: boolean;
    thumbnailUrl: string;
    autogeneratedImageInfo: any;
    idcImageUrl: string | undefined;
    idcImageBucketUrls: string[] | undefined;
};

function getImageViewersAssociatedWithFile(file: Entity): ImageViewerInfo {
    // check if image is in IDC
    let idcImageUrl = undefined;
    let idcImageBucketUrls = undefined;
    if (file.HTANDataFileID in IDC_MAPPINGS) {
        idcImageUrl = IDC_MAPPINGS[file.HTANDataFileID]['viewer_url'];
        const unparsedBucketUrl = IDC_MAPPINGS[file.HTANDataFileID]['gcs_urls'];
        idcImageBucketUrls = unparsedBucketUrl
            .substr(1, unparsedBucketUrl.length - 2)
            .split(',');
    }

    // custom submitted minerva stories (w/o thumbnails)
    const minervaCustomStoryLink =
        CUSTOM_MINERVA_STORY_MAPPINGS[getFileBase(file.filename)];
    // auto generated minerva stories and thumbnails
    const autogeneratedImageInfo =
        file.filename &&
        THUMBNAIL_AND_AUTOMINERVA_MAPPINGS.find(
            (f: any) => f.synid === file.synapseId
        );
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
        autogeneratedImageInfo,
        hasCustomStory,
        // has a viewer of there is a minerva link either custom or auto
        // generated
        hasImageViewer: !!minervaUrl || idcImageUrl !== undefined,
        idcImageUrl,
        idcImageBucketUrls,
    };
}

interface IFileTableProps {
    entities: Entity[];
    getGroupsByPropertyFiltered: any;
    patientCount: number;
}

@observer
export default class FileTable extends React.Component<IFileTableProps> {
    @observable.ref selected: Entity[] = [];
    @observable clicked: Entity | undefined;
    @observable isDownloadModalOpen = false;
    @observable isLinkOutModalOpen = false;
    @observable viewDetailsFile: Entity | undefined = undefined;
    @observable columnVisibility: { [columnKey: string]: boolean } = {};

    get defaultColumns(): IEnhancedDataTableColumn<Entity>[] {
        return [
            {
                name: 'Filename',
                selector: 'filename',
                wrap: true,
                sortable: true,
                grow: 1.4,
                cell: (file: Entity) => {
                    const truncatedFilename = truncateFilename(file.filename);
                    const linkOut =
                        doesFileIncludeLevel1OrLevel2SequencingData(file) ||
                        file.Component.startsWith('Imaging') ? (
                            <span
                                className={styles.clickable}
                                onClick={(e) => this.onClick(e, file)}
                            >
                                {truncatedFilename}
                            </span>
                        ) : (
                            <a
                                target="_blank"
                                href={`https://www.synapse.org/#!Synapse:${file.synapseId}`}
                            >
                                {truncatedFilename}
                            </a>
                        );

                    return (
                        <Tooltip overlay={getFileBase(file.filename)}>
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
                        file.biospecimen.map((b) => b.HTANBiospecimenID)
                    ).join(', ');
                },
                cell: (file: Entity) => {
                    const uniqueBiospecimens = _.uniq(
                        file.biospecimen.map((b) => b.HTANBiospecimenID)
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
                selector: AttributeMap[AttributeNames.assayName].path,
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
                        file.diagnosis.map((d) => d.TissueorOrganofOrigin)
                    ).join(', ');
                },
                cell: truncatedTableCell,
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
                                View Details
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
                selector: (file: Entity) => {
                    const cellXGeneLink =
                        CELLXGENE_MAPPINGS[getFileBase(file.filename)];
                    const bigQueryLink =
                        ISBCGC_MAPPINGS[getFileBase(file.filename)];
                    const imageViewers = getImageViewersAssociatedWithFile(
                        file
                    );

                    if (cellXGeneLink || bigQueryLink) {
                        let cellViewers: JSX.Element[] = [];

                        if (cellXGeneLink) {
                            cellViewers.push(
                                <span style={{ paddingRight: 5 }}>
                                    <a href={cellXGeneLink} target="_blank">
                                        CellxGene{' '}
                                        <FontAwesomeIcon
                                            icon={faExternalLinkAlt}
                                        />
                                    </a>
                                </span>
                            );
                        }
                        if (bigQueryLink) {
                            cellViewers.push(
                                <span style={{ paddingRight: 5 }}>
                                    <a href={bigQueryLink} target="_blank">
                                        BigQuery{' '}
                                        <FontAwesomeIcon
                                            icon={faExternalLinkAlt}
                                        />
                                    </a>
                                </span>
                            );
                        }

                        return cellViewers;
                    } else if (file.Component.startsWith('Imaging')) {
                        // TODO: Duke images are giving an issue: https://github.com/ncihtan/htan-portal/pull/380#pullrequestreview-946257535
                        if (
                            file.atlas_name === 'HTAN Duke' &&
                            file.assayName == 'H&E'
                        ) {
                            if (imageViewers.idcImageUrl) {
                                return (
                                    <a
                                        href={imageViewers.idcImageUrl}
                                        target="_blank"
                                    >
                                        IDC{' '}
                                        <FontAwesomeIcon
                                            icon={faExternalLinkAlt}
                                        />
                                    </a>
                                );
                            } else {
                                return 'Image Viewer Coming Soon';
                            }
                        }
                        if (
                            imageViewers.autogeneratedImageInfo &&
                            imageViewers.thumbnailUrl
                        ) {
                            return (
                                <div className={'dsa-container'}>
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
                                                        <a
                                                            style={{
                                                                color: 'white',
                                                            }}
                                                            href={
                                                                imageViewers.minervaUrl
                                                            }
                                                            target="_blank"
                                                        >
                                                            Minerva{' '}
                                                            <FontAwesomeIcon
                                                                icon={
                                                                    faExternalLinkAlt
                                                                }
                                                            />
                                                        </a>
                                                    )}
                                                    {imageViewers.minervaUrl &&
                                                        imageViewers.idcImageUrl &&
                                                        ' or '}
                                                    {imageViewers.idcImageUrl && (
                                                        <a
                                                            style={{
                                                                color: 'white',
                                                            }}
                                                            href={
                                                                imageViewers.idcImageUrl
                                                            }
                                                            target="_blank"
                                                        >
                                                            IDC{' '}
                                                            <FontAwesomeIcon
                                                                icon={
                                                                    faExternalLinkAlt
                                                                }
                                                            />
                                                        </a>
                                                    )}
                                                    {!imageViewers.hasImageViewer && (
                                                        <a
                                                            style={{
                                                                color: 'white',
                                                            }}
                                                            href={
                                                                imageViewers.thumbnailUrl
                                                            }
                                                            target="_blank"
                                                        >
                                                            Click to view
                                                            Thumbnail{' '}
                                                            <FontAwesomeIcon
                                                                icon={
                                                                    faExternalLinkAlt
                                                                }
                                                            />
                                                        </a>
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
                                                            'dsa-full-image'
                                                        }
                                                        src={
                                                            imageViewers.thumbnailUrl
                                                        }
                                                    />
                                                </a>
                                                {file.assayName !== 'H&E' && (
                                                    <span>
                                                        Thumbnail generated with{' '}
                                                        <a
                                                            style={{
                                                                color: 'white',
                                                            }}
                                                            href="https://github.com/adamjtaylor/miniature"
                                                        >
                                                            Miniature
                                                        </a>
                                                    </span>
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
                                                    className={'dsa-thumb'}
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
                                        <a
                                            href={imageViewers.minervaUrl}
                                            target="_blank"
                                            style={{ paddingRight: 5 }}
                                        >
                                            Minerva{' '}
                                            <FontAwesomeIcon
                                                icon={faExternalLinkAlt}
                                            />
                                        </a>
                                    )}
                                    {imageViewers.idcImageUrl && (
                                        <a
                                            href={imageViewers.idcImageUrl}
                                            target="_blank"
                                        >
                                            IDC{' '}
                                            <FontAwesomeIcon
                                                icon={faExternalLinkAlt}
                                            />
                                        </a>
                                    )}
                                </>
                            );
                        } else {
                            return 'Image Viewer Coming Soon';
                        }
                    } else {
                        return '';
                    }
                },
                cell: truncatedTableCell,
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
            filename: true,
            biospecimen: true,
            atlas_name: true,
            [AttributeMap[AttributeNames.assayName].path!]: true,
            level: true,
            diagnosis: true,
            primaryParents: true,

            //others to exclude
            Component: true,
            WPAtlas: true,
            biospecimenIds: true,
            cases: true,
            demographics: true,
            demographicsIds: true,
            diagnosisIds: true,
        };

        const listSelectors: any = {
            HTANParentDataFileID: {
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
                    file={this.viewDetailsFile}
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
                    customControls={
                        <button
                            className={classNames(
                                'btn btn-primary',
                                !this.hasFilesSelected ? 'invisible' : ''
                            )}
                            disabled={!this.hasFilesSelected}
                            onMouseDown={this.onDownload}
                        >
                            <FontAwesomeIcon icon={faDownload} />{' '}
                            {`Download ${this.selected.length} selected ${
                                this.selected.length === 1 ? 'file' : 'files'
                            }`}
                        </button>
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
                            d.HTANParticipantID.toUpperCase().includes(
                                tUpperCase
                            )
                        );
                    }}
                    data={this.props.entities}
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

                <button
                    style={{ marginTop: -70 }}
                    className={classNames(
                        'btn btn-primary',
                        !this.hasFilesSelected ? 'invisible' : ''
                    )}
                    disabled={!this.hasFilesSelected}
                    onMouseDown={this.onDownload}
                >
                    <FontAwesomeIcon icon={faDownload} />{' '}
                    {this.hasFilesSelected
                        ? 'Download selected files'
                        : 'Select files for download below'}
                </button>
            </>
        ) : null;
    }
}
