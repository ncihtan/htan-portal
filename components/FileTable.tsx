import _ from "lodash";
import {action, makeObservable, observable} from 'mobx';
import { observer } from 'mobx-react';
import React from 'react';
import {Button, Modal} from "react-bootstrap";
import DataTable from "react-data-table-component";

import { Atlas, Entity } from '../lib/helpers';
import { PropNames } from "../lib/types";
import {getDefaultDataTableStyle} from "../lib/dataTableHelpers";

interface IFileTableHeaderProps {
    filteredFiles: Entity[];
    getGroupsByPropertyFiltered: any;
    patientCount: number;
    onDownload: () => void;
}

const FileTableHeader: React.FunctionComponent<IFileTableHeaderProps> = props => {
    return (
        <>
            <div className={'summary'}>
                <div>
                    <strong>Summary:</strong>
                </div>

                <div>{props.filteredFiles.length} Files</div>

                <div>
                    {
                        _.keys(
                            props.getGroupsByPropertyFiltered[
                                PropNames.AtlasName
                                ]
                        ).length
                    }{' '}
                    Atlases
                </div>

                <div>
                    {
                        _.keys(
                            props.getGroupsByPropertyFiltered[
                                PropNames.TissueorOrganofOrigin
                                ]
                        ).length
                    }{' '}
                    Organs
                </div>

                <div>
                    {
                        _.keys(
                            props.getGroupsByPropertyFiltered[
                                PropNames.PrimaryDiagnosis
                                ]
                        ).length
                    }{' '}
                    Cancer Types
                </div>

                <div>{props.patientCount} Cases</div>

                <div>
                    {
                        _(props.filteredFiles)
                            .map((f) => f.HTANParentBiospecimenID)
                            .uniq()
                            .value().length
                    }{' '}
                    Biospecimens
                </div>

                <div>
                    {
                        _.keys(
                            props.getGroupsByPropertyFiltered[
                                PropNames.Component
                                ]
                        ).length
                    }{' '}
                    Assays
                </div>

            </div>

            <div className="controls ml-auto">

                <Button
                    variant="primary"
                    size="sm"
                    onClick={props.onDownload}
                >
                    Download
                </Button>

            </div>
        </>
    );
}

interface IFileDownloadModalProps {
    filenames: string[];
    onClose: () => void;
    isOpen: boolean;
}

const FileDownloadModal: React.FunctionComponent<IFileDownloadModalProps> = props => {
    const script = props.filenames.map(f => `synapse get ${f}`).join("\n");

    return (
        <Modal show={props.isOpen} onHide={props.onClose}>
            <Modal.Header closeButton>
                <Modal.Title>Download Selected Files</Modal.Title>
            </Modal.Header>

            <Modal.Body>
                <p>You can use the synapse command line client to download the selected files:</p>
                <pre className="pre-scrollable">
                    <code>
                        {script}
                    </code>
                </pre>
                <p>For more information see the{' '}
                    <a
                        href="https://docs.synapse.org/articles/downloading_data.html"
                        target="_blank"
                    >
                        synapse documentation
                    </a>
                </p>
            </Modal.Body>

            <Modal.Footer>
                <Button
                    variant="secondary"
                    onClick={props.onClose}
                >
                    Close
                </Button>
            </Modal.Footer>
        </Modal>
    );
}

interface IFileTableProps {
    entities: Entity[];
    getGroupsByPropertyFiltered: any;
    patientCount: number;
}

@observer
export default class FileTable extends React.Component<IFileTableProps> {
    selected: Entity[] = [];
    @observable isDownloadModalOpen = false;

    get selectedFilenames () {
        return this.selected.map(e => e.filename);
    }

    get columns() {
        return [
            {
                name: "Filename",
                selector: 'filename',
                wrap: true,
                sortable: true,
            },
            {
                name: "Atlas",
                selector: 'WPAtlas.title.rendered',
                grow: 2,
                wrap: true,
                sortable: true,
            },
            {
                name: "Assay",
                selector: 'Component',
                format: (entity: Entity) => entity.Component
                    .replace(/^bts:/, '')
                    .replace("-","")
                    .replace(/Level[\d]+/i,""),
                wrap: true,
                sortable: true,
            },
            {
                name: "Level",
                selector: 'level',
                wrap: true,
                sortable: true,
            },
            {
                name: "Organ",
                selector: 'diagnosis.TissueorOrganofOrigin',
                wrap: true,
                sortable: true,
            },
            {
                name: "Diagnosis",
                selector: 'diagnosis.PrimaryDiagnosis',
                wrap: true,
                sortable: true,
            },
        ];
    };

    constructor(props: IFileTableProps) {
        super(props);
        makeObservable(this);
    }

    @action onDownload = (evt:any) => {
        this.isDownloadModalOpen = true;
        // Defocus "Download" button
        evt.target.blur();
    }

    @action onModalClose = () => {
        this.isDownloadModalOpen = false;
    };

    onSelect = (state: { allSelected: boolean, selectedCount: number, selectedRows: Entity[] }) => {
        this.selected = state.selectedRows;
    }

    render() {
        return this.props.entities ? (
            <>
                <FileDownloadModal
                    filenames={this.selectedFilenames}
                    onClose={this.onModalClose}
                    isOpen={this.isDownloadModalOpen}
                />
                <DataTable
                    paginationServerOptions={{
                        persistSelectedOnPageChange: false,
                        persistSelectedOnSort: false,
                    }}
                    columns={this.columns}
                    data={this.props.entities}
                    striped={true}
                    dense={true}
                    selectableRows={true}
                    onSelectedRowsChange={this.onSelect}
                    pagination={true}
                    paginationPerPage={50}
                    paginationRowsPerPageOptions={[10, 20, 50, 100, 500]}
                    noHeader={true}
                    subHeader={true}
                    subHeaderAlign="left"
                    subHeaderComponent={
                        <FileTableHeader
                            filteredFiles={this.props.entities}
                            getGroupsByPropertyFiltered={this.props.getGroupsByPropertyFiltered}
                            patientCount={this.props.patientCount}
                            onDownload={this.onDownload}
                        />
                    }
                    customStyles={getDefaultDataTableStyle()}
                />
            </>
        ) : null;
    }
}
