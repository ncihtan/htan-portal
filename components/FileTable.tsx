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

const cellXGeneMappings = require('../data/cellxgene-mappings.json');
const minervaMappings = require('../data/minerva-story-mappings.json');
const dsaMappings = require('../data/dsa-images.json');

interface IFileDownloadModalProps {
    files: Entity[];
    onClose: () => void;
    isOpen: boolean;
}

interface IViewDetailsModalProps {
    file: Entity | undefined;
    onClose: () => void;
    columns: IEnhancedDataTableColumn<Entity>[];
}

const DETAILS_COLUMN_NAME = 'Details';

const isDSAEnabled = () => {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.has('dsa');
};

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
                These will soon be available through{' '}
                <a href="https://www.cancergenomicscloud.org/" target="_blank">
                    Seven Bridges' Cancer Genomics Cloud
                </a>
                .
            </p>
        </>
    );
};

const ImagingInstructions: React.FunctionComponent<{ files: Entity[] }> = (
    props
) => {
    return (
        <>
            <p>Your selection includes imaging data:</p>
            <pre className="pre-scrollable">
                <code>
                    {props.files.map((f) => getFileBase(f.filename)).join('\n')}
                </code>
            </pre>
            <p>It is not possible to download imaging data yet.</p>
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
        <Modal show={props.file !== undefined} onHide={props.onClose}>
            <Modal.Header closeButton>
                <Modal.Title>Details</Modal.Title>
            </Modal.Header>

            <Modal.Body>
                <Table striped bordered>
                    <tbody>
                        {props.columns.map((column) => (
                            <tr key={column.name as string}>
                                <td style={{ fontWeight: 'bold' }}>
                                    {column.name}
                                </td>
                                <td>{renderCell(column, props.file!)}</td>
                            </tr>
                        ))}
                    </tbody>
                </Table>
            </Modal.Body>

            <Modal.Footer>
                <Button variant="secondary" onClick={props.onClose}>
                    Close
                </Button>
            </Modal.Footer>
        </Modal>
    );
};

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

    get columns() {
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
                name: 'View',
                selector: (file: Entity) => {
                    const cellXGeneLink =
                        cellXGeneMappings[getFileBase(file.filename)];
                    const minervaLink =
                        minervaMappings[getFileBase(file.filename)];
                    const dsa = file.synapseId && dsaMappings[file.synapseId];

                    if (cellXGeneLink) {
                        return (
                            <a href={cellXGeneLink} target="_blank">
                                CellxGene{' '}
                                <FontAwesomeIcon icon={faExternalLinkAlt} />
                            </a>
                        );
                    } else if (minervaLink) {
                        return (
                            <a href={minervaLink} target="_blank">
                                Minerva Story{' '}
                                <FontAwesomeIcon icon={faExternalLinkAlt} />
                            </a>
                        );
                    } else if (file.Component.startsWith('Imaging')) {
                        if (isDSAEnabled() && dsa && file.assayName === 'H&E') {
                            return (
                                <div className={'dsa-container'}>
                                    <Tooltip
                                        placement="left"
                                        overlay={
                                            <>
                                                <a
                                                    href={`https://imaging.htan.dev/girder/#item/${dsa.dsaId}`}
                                                    target="_blank"
                                                >
                                                    <img
                                                        className={
                                                            'dsa-full-image'
                                                        }
                                                        src={`${dsa.dsaSmallThumbUrl}`}
                                                    />
                                                </a>
                                            </>
                                        }
                                    >
                                        <a
                                            href={`https://imaging.htan.dev/girder/#item/${dsa.dsaId}`}
                                            target="_blank"
                                        >
                                            <img
                                                className={'dsa-thumb'}
                                                src={`${dsa.dsaSmallThumbUrl}?height=100&width=100&fill=none`}
                                            />
                                        </a>
                                    </Tooltip>
                                </div>
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
            {
                name: DETAILS_COLUMN_NAME,
                selector: (file: Entity) => 'Details',
                cell: (file: Entity) => {
                    if (true) {
                        // TODO: determine if there are more details
                        return (
                            <button
                                className={'btn btn-sm btn-link'}
                                onClick={action(() => {
                                    this.viewDetailsFile = file;
                                })}
                            >
                                View Details
                            </button>
                        );
                    }
                },
                wrap: true,
                sortable: false,
                searchable: false,
            },
        ];
    }

    constructor(props: IFileTableProps) {
        super(props);
        makeObservable(this);
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
                    columns={this.columns.filter(
                        (c) => c.name !== DETAILS_COLUMN_NAME
                    )}
                />

                <EnhancedDataTable
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
