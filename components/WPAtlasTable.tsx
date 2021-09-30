import _ from 'lodash';
import { NextRouter } from 'next/router';
import React from 'react';
import { getDefaultDataTableStyle } from '../lib/dataTableHelpers';
import { Atlas, Entity, setTab } from '../lib/helpers';
import EnhancedDataTable from './EnhancedDataTable';
import { observer } from 'mobx-react';
import { action, computed, makeObservable, observable } from 'mobx';
import classNames from 'classnames';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faDownload } from '@fortawesome/free-solid-svg-icons';
import { ExploreTab } from './ExploreTabs';
import { Button, Modal } from 'react-bootstrap';
import getAtlasMetaData from '../lib/getAtlasMetaData';
import {
    AttributeNames,
    ExploreSelectedFilter,
    ISelectedFiltersByAttrName,
} from '../lib/types';

interface IWPAtlasTableProps {
    router: NextRouter;
    synapseAtlasData: Atlas[];
    selectedAtlases?: Atlas[];
    filteredAtlases?: Atlas[];
    onSelectAtlas?: (selected: Atlas[]) => void;
    selectedFiltersByAttrName: ISelectedFiltersByAttrName;
    filteredCases: Entity[];
    filteredBiospecimens: Entity[];
}

const atlasMetadata = getAtlasMetaData();

interface IAtlasMetadataLinkModalProps {
    isOpen: boolean;
    onClose: () => void;
    atlas: Atlas | null;
}

const SynapseDataLink = (props: { id: string }) => (
    <a
        href={`https://www.synapse.org/#!Synapse:${props.id}/files/`}
        target={'_blank'}
    >
        {props.id}
    </a>
);

const AtlasMetadataLinkModal: React.FunctionComponent<IAtlasMetadataLinkModalProps> = (
    props
) => {
    return (
        <Modal show={props.isOpen} onHide={props.onClose}>
            {props.atlas && (
                <>
                    <Modal.Header closeButton>
                        <Modal.Title>
                            Download <strong>{props.atlas.htan_name}</strong>{' '}
                            Metadata
                        </Modal.Title>
                    </Modal.Header>

                    <Modal.Body>
                        <table className={'table table-striped'}>
                            <thead>
                                <tr>
                                    <th>Synapse ID</th>
                                    <th>Category</th>
                                    <th>Num Items</th>
                                </tr>
                            </thead>
                            <tbody>
                                {_.chain(atlasMetadata[props.atlas.htan_id])
                                    .map((info, category) => ({
                                        row: (
                                            <tr>
                                                <td>
                                                    <SynapseDataLink
                                                        id={info.synapseId}
                                                    />
                                                </td>
                                                <td>{category}</td>
                                                <td>{info.numItems}</td>
                                            </tr>
                                        ),
                                        category,
                                    }))
                                    .sortBy((obj) => obj.category)
                                    .map((obj) => obj.row)
                                    .value()}
                            </tbody>
                        </table>
                    </Modal.Body>

                    <Modal.Footer>
                        <Button variant="secondary" onClick={props.onClose}>
                            Close
                        </Button>
                    </Modal.Footer>
                </>
            )}
        </Modal>
    );
};

type WPAtlasTableData = Atlas & { isSelected: boolean };

@observer
export default class WPAtlasTable extends React.Component<IWPAtlasTableProps> {
    @observable metadataModalAtlas: Atlas | null = null;

    @computed
    get selectedAtlases() {
        return _.keyBy(this.props.selectedAtlases || [], (a) => a.htan_id);
    }

    @computed get hasAtlasesSelected() {
        return (this.props.selectedAtlases || []).length > 0;
    }

    constructor(props: IWPAtlasTableProps) {
        super(props);
        makeObservable(this);
    }

    isRowSelected = (atlas: Atlas) => {
        return this.selectedAtlases[atlas.htan_id] !== undefined;
    };

    // we need to update data every time the selection changes to rerender the table
    // see selectableRowSelected property at https://www.npmjs.com/package/react-data-table-component#row-selection
    @computed get data(): WPAtlasTableData[] {
        return (this.props.filteredAtlases || this.props.synapseAtlasData).map(
            (a) =>
                ({
                    ...a,
                    isSelected: this.isRowSelected(a),
                } as WPAtlasTableData)
        );
    }

    @computed get filteredCasesByAtlas() {
        return _.groupBy(this.props.filteredCases, (c: Entity) => c.atlasid);
    }

    @computed get filteredBiospecimensByAtlas() {
        return _.groupBy(
            this.props.filteredBiospecimens,
            (c: Entity) => c.atlasid
        );
    }

    @computed get shouldShowFilteredFractions() {
        return !_.isEmpty(this.props.selectedFiltersByAttrName);
    }

    get columns() {
        return [
            {
                name: 'Atlas Name',
                selector: (atlas: Atlas) => atlas.htan_name,
                grow: 1.25,
                wrap: true,
                sortable: true,
            },
            {
                name: 'Lead Institution',
                selector: (atlas: Atlas) => atlas.WPAtlas.lead_institutions,
                grow: 2.5,
                wrap: true,
                sortable: true,
            },
            {
                name: 'Atlas Description',
                selector: 'WPAtlas.title.rendered',
                format: (atlas: Atlas) =>
                    atlas.WPAtlas ? (
                        <span>
                            <a
                                target="_blank"
                                href={`https://humantumoratlas.org/${atlas.htan_id}`}
                            >
                                {atlas.WPAtlas.title.rendered}
                            </a>
                        </span>
                    ) : (
                        'N/A'
                    ),
                grow: 2.5,
                wrap: true,
                sortable: true,
            },
            {
                name: 'Metadata',
                grow: 0.5,
                selector: 'htan_id', // dummy selector - you need to put something or else nothing will render
                cell: (atlas: Atlas) => {
                    if (atlas.htan_id in atlasMetadata) {
                        return (
                            <button
                                className={'btn btn-sm'}
                                onClick={action(() => {
                                    this.metadataModalAtlas = atlas;
                                })}
                            >
                                <FontAwesomeIcon icon={faDownload} />
                            </button>
                        );
                    } else {
                        return <span>None</span>;
                    }
                },
            },
            {
                name: 'Cases',
                grow: 0.5,
                selector: 'num_cases',
                cell: (atlas: Atlas) => (
                    <span className="ml-auto">
                        {this.shouldShowFilteredFractions
                            ? `${
                                  (
                                      this.filteredCasesByAtlas[
                                          atlas.htan_id
                                      ] || []
                                  ).length
                              }/`
                            : ''}
                        {atlas.num_cases}
                    </span>
                ),
                sortable: true,
            },
            {
                name: 'Biospecimens',
                selector: 'num_biospecimens',
                cell: (atlas: Atlas) => (
                    <span className="ml-auto">
                        {this.shouldShowFilteredFractions
                            ? `${
                                  (
                                      this.filteredBiospecimensByAtlas[
                                          atlas.htan_id
                                      ] || []
                                  ).length
                              }/`
                            : ''}
                        {atlas.num_biospecimens}
                    </span>
                ),
                sortable: true,
            },
            {
                name: 'Viewers',
                selector: 'htan_id', // dummy selector - you need to put something or else nothing will render
                grow: 1.5,
                cell: (atlas: Atlas) => {
                    if (atlas.htan_name === 'HTAN MSK') {
                        return (
                            <a href='/explore?selectedFilters=%5B%7B"value"%3A"hdf5"%2C"label"%3A"hdf5"%2C"group"%3A"FileFormat"%2C"count"%3A11%2C"isSelected"%3Afalse%7D%2C%7B"group"%3A"AtlasName"%2C"value"%3A"HTAN+MSK"%7D%5D&tab=file'>
                                CellxGene (11)
                            </a>
                        );
                    } else if (atlas.htan_name === 'HTAN OHSU') {
                        return (
                            <a
                                href="https://minerva-story-htan-ohsu-demo.surge.sh/"
                                target="_blank"
                            >
                                Minerva Story (1)
                            </a>
                        );
                    } else if (atlas.htan_name === 'HTAN HMS') {
                        return (
                            <a href='/explore?selectedFilters=%5B%7B"group"%3A"AtlasName"%2C"value"%3A"HTAN+HMS"%7D%2C%7B"value"%3A"OME-TIFF"%2C"label"%3A"OME-TIFF"%2C"group"%3A"FileFormat"%2C"count"%3A16%2C"isSelected"%3Afalse%7D%5D&tab=file'>
                                Minerva Story (15)
                            </a>
                        );
                    } else if (atlas.htan_name === 'HTAN BU') {
                        return (
                            <a
                                href="https://cellxgene.cziscience.com/d/BFAA0C46-7E34-4FA9-B08C-6DC6013B735A.cxg/"
                                target="_blank"
                            >
                                CellxGene (1)
                            </a>
                        );
                    } else if (atlas.htan_name === 'HTAN Vanderbilt') {
                        return (
                            <a href='/explore?selectedFilters=%5B%7B"value"%3A"hdf5"%2C"label"%3A"hdf5"%2C"group"%3A"FileFormat"%2C"count"%3A11%2C"isSelected"%3Afalse%7D%2C%7B"group"%3A"AtlasName"%2C"value"%3A"HTAN+Vanderbilt"%7D%5D&tab=file'>
                                CellxGene (1)
                            </a>
                        );
                    } else if (atlas.htan_name === 'HTAN CHOP') {
                        return (
                            <a href='/explore?selectedFilters=%5B%7B"value"%3A"hdf5"%2C"label"%3A"hdf5"%2C"group"%3A"FileFormat"%2C"count"%3A11%2C"isSelected"%3Afalse%7D%2C%7B"group"%3A"AtlasName"%2C"value"%3A"HTAN+CHOP"%7D%5D&tab=file'>
                                CellxGene (3)
                            </a>
                        );
                    } else {
                        return null;
                    }
                },
            },
            // {
            //     name: 'Atlas ID',
            //     selector: (atlas: Atlas) => atlas.htan_id.toUpperCase(),
            //     wrap: true,
            //     sortable: true,
            // },
        ];
    }

    @action
    onSelect = (state: {
        allSelected: boolean;
        selectedCount: number;
        selectedRows: Atlas[];
    }) => {
        if (this.props.onSelectAtlas) {
            this.props.onSelectAtlas(state.selectedRows);
        }
    };

    @action onViewFiles = (e: any) => {
        e.preventDefault();
        setTab(ExploreTab.FILE, this.props.router);
    };

    render() {
        return (
            <>
                <EnhancedDataTable
                    customControls={
                        <button
                            className={classNames(
                                'btn btn-primary',
                                !this.hasAtlasesSelected ? 'invisible' : ''
                            )}
                            disabled={!this.hasAtlasesSelected}
                            onMouseDown={this.onViewFiles}
                        >
                            <FontAwesomeIcon icon={faDownload} />{' '}
                            {`View files for ${
                                this.props.selectedAtlases?.length
                            } selected ${
                                this.props.selectedAtlases?.length === 1
                                    ? 'atlas'
                                    : 'atlases'
                            }`}
                        </button>
                    }
                    columns={this.columns}
                    defaultSortField={'WPAtlas.lead_institutions'}
                    data={this.data}
                    selectableRows={true}
                    onSelectedRowsChange={this.onSelect}
                    selectableRowSelected={(r: { isSelected: boolean }) =>
                        r.isSelected
                    }
                    striped={true}
                    noHeader={true}
                    customStyles={getDefaultDataTableStyle()}
                />
                <AtlasMetadataLinkModal
                    isOpen={this.metadataModalAtlas !== null}
                    onClose={action(() => {
                        this.metadataModalAtlas = null;
                    })}
                    atlas={this.metadataModalAtlas}
                />
            </>
        );
    }
}
