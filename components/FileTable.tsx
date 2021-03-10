import { action, computed, makeObservable, observable } from 'mobx';
import { observer } from 'mobx-react';
import React, { SyntheticEvent } from 'react';
import { Button, Modal, Form } from 'react-bootstrap';
import DataTable from 'react-data-table-component';
import _ from 'lodash';
import classNames from 'classnames';

import { Atlas, Entity } from '../lib/helpers';
import { getDefaultDataTableStyle } from '../lib/dataTableHelpers';
import { faDownload, faSearch } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

interface IFileDownloadModalProps {
    filenames: string[];
    onClose: () => void;
    isOpen: boolean;
}

const FileDownloadModal: React.FunctionComponent<IFileDownloadModalProps> = (
    props
) => {
    const script = props.filenames.map((f) => `synapse get ${f}`).join('\n');

    return (
        <Modal show={props.isOpen} onHide={props.onClose}>
            <Modal.Header closeButton>
                <Modal.Title>Download Selected Files</Modal.Title>
            </Modal.Header>

            <Modal.Body>
                <p>
                    You can use the synapse command line client to download the
                    selected files:
                </p>
                <pre className="pre-scrollable">
                    <code>{script}</code>
                </pre>
                <p>
                    For more information see the{' '}
                    <a
                        href="https://docs.synapse.org/articles/downloading_data.html"
                        target="_blank"
                    >
                        synapse documentation
                    </a>
                </p>
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

    @observable isDownloadModalOpen = false;
    @observable caseFilterText = '';

    get selectedFilenames() {
        return this.selected.map((e) => e.filename);
    }

    get columns() {
        return [
            {
                name: 'Filename',
                selector: 'filename',
                wrap: true,
                sortable: true,
            },
            {
                name: 'Atlas ID',
                selector: "atlasid",
                format: (file: Entity) => file.atlasid?.toUpperCase(),
                grow: 2,
                wrap: true,
                sortable: true,
            },
            {
                name: 'Biospecimen',
                selector: (file: Entity) => {
                    return file.primaryParents
                        ? _.uniq(
                              file.primaryParents.map(
                                  (_file) =>
                                      _file.biospecimen!.HTANBiospecimenID
                              )
                          )
                        : file.biospecimen!.HTANBiospecimenID;
                    return 'hello';
                },
                wrap: true,
                sortable: true,
            },
            {
                name: 'Assay',
                selector: 'Component',
                format: (entity: Entity) =>
                    entity.Component.replace(/^bts:/, '')
                        .replace('-', '')
                        .replace(/Level[\d]+/i, ''),
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
                selector: 'diagnosis.TissueorOrganofOrigin',
                wrap: true,
                sortable: true,
            },
            {
                name: 'Diagnosis',
                selector: 'diagnosis.PrimaryDiagnosis',
                wrap: true,
                sortable: true,
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

    @action onModalClose = () => {
        this.isDownloadModalOpen = false;
    };

    onSelect = (state: {
        allSelected: boolean;
        selectedCount: number;
        selectedRows: Entity[];
    }) => {
        this.selected = state.selectedRows;
    };

    @computed get caseFilteredFiles() {
        if (this.caseFilterText.length > 0) {
            return this.props.entities.filter((file) => {
                return file.diagnosis?.HTANParticipantID.includes(
                    this.caseFilterText
                );
            });
        } else {
            return this.props.entities;
        }
    }

    @action.bound
    private onChangeCaseFilterText(evt: SyntheticEvent<any>) {
        this.caseFilterText = (evt.target as any).value;
    }

    @computed get hasFilesSelected() {
        return this.selectedFilenames.length > 0;
    }

    render() {
        return this.props.entities ? (
            <>
                <FileDownloadModal
                    filenames={this.selectedFilenames}
                    onClose={this.onModalClose}
                    isOpen={this.isDownloadModalOpen}
                />

                <div
                    style={{
                        marginBottom: 10,
                    }}
                    className={'d-flex justify-content-between'}
                >
                    <button
                        className={classNames(
                            'btn btn-primary',
                            !this.hasFilesSelected ? 'btn-disabled' : ''
                        )}
                        disabled={!this.hasFilesSelected}
                        onMouseDown={this.onDownload}
                    >
                        <FontAwesomeIcon icon={faDownload} />{' '}
                        {this.hasFilesSelected
                            ? 'Download selected files'
                            : 'Select files for download below'}
                    </button>

                    <div className="input-group" style={{ width: 300 }}>
                        <input
                            className="form-control py-2 border-right-0 border"
                            type="search"
                            onInput={this.onChangeCaseFilterText}
                            value={this.caseFilterText}
                            placeholder={'Search Patient ID'}
                            id="example-search-input"
                        />
                        <span className="input-group-append">
                            <div className="input-group-text bg-transparent">
                                {' '}
                                <FontAwesomeIcon icon={faSearch} />
                            </div>
                        </span>
                    </div>
                </div>

                <DataTable
                    paginationServerOptions={{
                        persistSelectedOnPageChange: false,
                        persistSelectedOnSort: false,
                    }}
                    columns={this.columns}
                    data={this.caseFilteredFiles}
                    striped={true}
                    dense={false}
                    selectableRows={true}
                    onSelectedRowsChange={this.onSelect}
                    pagination={true}
                    paginationPerPage={50}
                    paginationRowsPerPageOptions={[10, 20, 50, 100, 500]}
                    noHeader={true}
                    subHeader={false}
                    subHeaderAlign="right"
                    subHeaderComponent={
                        <div
                            className="ml-auto"
                            style={{
                                display: 'flex',
                            }}
                        >
                            <Form.Control
                                placeholder={'Search Patient ID'}
                                value={this.caseFilterText}
                                onChange={this.onChangeCaseFilterText}
                                style={{ marginRight: 5 }}
                                size={'sm'}
                            />
                            <Button
                                variant="primary"
                                size="sm"
                                onClick={this.onDownload}
                            >
                                Download
                            </Button>
                        </div>
                    }
                    customStyles={getDefaultDataTableStyle()}
                />

                <button
                    style={{ marginTop: -70 }}
                    className={classNames(
                        'btn btn-primary',
                        !this.hasFilesSelected ? 'btn-disabled' : ''
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
