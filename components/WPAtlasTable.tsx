import _ from 'lodash';
import { NextRouter } from 'next/router';
import Tooltip from 'rc-tooltip';
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

const MetaDataLink = (props: { id: string }) => (
    <a href={`https://htan-metadata.surge.sh/${props.id}.csv`} download>
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
                                    .map((info, index) => ({
                                        row: (
                                            <tr>
                                                <td>
                                                    <MetaDataLink
                                                        id={info.synapseId}
                                                    />
                                                </td>
                                                <td>{info.component}</td>
                                                <td>{info.numItems}</td>
                                            </tr>
                                        ),
                                        component: info.component,
                                    }))
                                    .sortBy((obj) => obj.component)
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

const MinervaStoryViewerLink = (props: { url: string; count: number }) => (
    <Tooltip overlay="Minerva Story">
        <a
            href={props.url}
            target="_blank"
            style={{
                paddingRight: 8,
                fontFamily: 'monospace',
                textDecoration: 'none',
            }}
        >
            {props.count < 100 && '\u00A0'}
            {props.count < 10 && '\u00A0'}
            {props.count}{' '}
            <img
                width={20}
                src="https://user-images.githubusercontent.com/1334004/156241219-a3062991-ba9d-4201-ad87-3c9c1f0c61d8.png"
            />
        </a>
    </Tooltip>
);

const AutoMinervaViewerLink = (props: { url: string; count: number }) => (
    <Tooltip overlay="Autominerva">
        <a
            href={props.url}
            style={{
                paddingRight: 8,
                fontFamily: 'monospace',
                textDecoration: 'none',
            }}
        >
            {props.count < 100 && '\u00A0'}
            {props.count < 10 && '\u00A0'}
            {props.count}{' '}
            <img
                width={20}
                src="https://user-images.githubusercontent.com/1334004/159789346-b647c772-48fe-4652-8d2b-3eecf6690f1f.png"
            />
        </a>
    </Tooltip>
);

const CBioPortalViewerLink = (props: { url: string; count: number }) => (
    <Tooltip overlay="cBioPortal">
        <a
            href={props.url}
            target="_blank"
            style={{
                paddingRight: 8,
                fontFamily: 'monospace',
                textDecoration: 'none',
            }}
        >
            {props.count < 100 && '\u00A0'}
            {props.count < 10 && '\u00A0'}
            {props.count}{' '}
            <img
                width={20}
                src={'https://avatars.githubusercontent.com/u/9876251?s=20&v=4'}
            />
        </a>
    </Tooltip>
);

const CellxgeneViewerLink = (props: { url: string; count: number }) => (
    <Tooltip overlay="cellxgene">
        <a
            href={props.url}
            target="_blank"
            style={{
                paddingRight: 8,
                fontFamily: 'monospace',
                textDecoration: 'none',
            }}
        >
            {props.count < 100 && '\u00A0'}
            {props.count < 10 && '\u00A0'}
            {props.count}{' '}
            <img
                width={20}
                src={
                    'https://pbs.twimg.com/profile_images/1285714433981812736/-wuBO62N_400x400.jpg'
                }
            />
        </a>
    </Tooltip>
);

const BroadSingleCellPortalViewerLink = (props: {
    url: string;
    count: number;
}) => (
    <Tooltip overlay="Broad Single Cell Portal">
        <a
            href={props.url}
            target="_blank"
            style={{
                paddingRight: 8,
                fontFamily: 'monospace',
                textDecoration: 'none',
            }}
        >
            {props.count < 100 && '\u00A0'}
            {props.count < 10 && '\u00A0'}
            {props.count}{' '}
            <img
                width={20}
                src={
                    'https://user-images.githubusercontent.com/1334004/171445636-2458ddf6-ce48-4f1f-ab7d-d56487b34ef0.png'
                }
            />
        </a>
    </Tooltip>
);

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
                name: 'Lab Name',
                selector: (atlas: Atlas) => atlas.htan_name,
                grow: 1.25,
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
                            <CellxgeneViewerLink
                                url={
                                    '/explore?selectedFilters=%5B%7B"value"%3A"hdf5"%2C"label"%3A"hdf5"%2C"group"%3A"FileFormat"%2C"count"%3A11%2C"isSelected"%3Afalse%7D%2C%7B"group"%3A"AtlasName"%2C"value"%3A"HTAN+MSK"%7D%5D&tab=file'
                                }
                                count={11}
                            />
                        );
                    } else if (atlas.htan_name === 'HTAN Duke') {
                        return (
                            <>
                                <AutoMinervaViewerLink
                                    url={
                                        '/explore?selectedFilters=%5B%7B"value"%3A"mIHC"%2C"label"%3A"mIHC"%2C"group"%3A"assayName"%2C"count"%3A62%2C"isSelected"%3Afalse%7D%2C%7B"value"%3A"t-CyCIF"%2C"label"%3A"t-CyCIF"%2C"group"%3A"assayName"%2C"count"%3A400%2C"isSelected"%3Afalse%7D%2C%7B"value"%3A"MIBI"%2C"label"%3A"MIBI"%2C"group"%3A"assayName"%2C"count"%3A165%2C"isSelected"%3Afalse%7D%2C%7B"value"%3A"IMC"%2C"label"%3A"IMC"%2C"group"%3A"assayName"%2C"count"%3A41%2C"isSelected"%3Afalse%7D%2C%7B"value"%3A"H%26E"%2C"label"%3A"H%26E"%2C"group"%3A"assayName"%2C"count"%3A254%2C"isSelected"%3Afalse%7D%2C%7B"value"%3A"CyCIF"%2C"label"%3A"CyCIF"%2C"group"%3A"assayName"%2C"count"%3A13%2C"isSelected"%3Afalse%7D%2C%7B"group"%3A"AtlasName"%2C"value"%3A"HTAN+Duke"%7D%5D&tab=file'
                                    }
                                    count={107}
                                />
                            </>
                        );
                    } else if (atlas.htan_name === 'HTAN OHSU') {
                        return (
                            <>
                                <CBioPortalViewerLink
                                    url={
                                        'https://www.cbioportal.org/patient?studyId=brca_hta9_htan_2022&caseId=HTA9_1'
                                    }
                                    count={1}
                                />
                                <MinervaStoryViewerLink
                                    url={
                                        'https://minerva-story-htan-ohsu-demo.surge.sh/'
                                    }
                                    count={1}
                                />
                            </>
                        );
                    } else if (atlas.htan_name === 'HTAN HMS') {
                        return (
                            <AutoMinervaViewerLink
                                url={
                                    '/explore?selectedFilters=%5B%7B"group"%3A"AtlasName"%2C"value"%3A"HTAN+HMS"%7D%2C%7B"value"%3A"OME-TIFF"%2C"label"%3A"OME-TIFF"%2C"group"%3A"FileFormat"%2C"count"%3A16%2C"isSelected"%3Afalse%7D%5D&tab=file'
                                }
                                count={348}
                            />
                        );
                    } else if (atlas.htan_name === 'HTAN BU') {
                        return (
                            <CellxgeneViewerLink
                                url={
                                    'https://cellxgene.cziscience.com/d/BFAA0C46-7E34-4FA9-B08C-6DC6013B735A.cxg/'
                                }
                                count={1}
                            />
                        );
                    } else if (atlas.htan_name === 'HTAN Vanderbilt') {
                        return (
                            <>
                                {/* Outddated Cellxgene Instance */}
                                {/*<CellxgeneViewerLink url={'https://cellxgene.cziscience.com/d/9899E3D8-ACE5-40BD-AC93-7AB7CE2AEC70.cxg/'} count={1} />*/}
                                <Tooltip overlay="cellxgene temporarily disabled (update pending)">
                                    <a
                                        style={{
                                            paddingRight: 8,
                                            fontFamily: 'monospace',
                                            textDecoration: 'none',
                                            cursor: 'no-drop',
                                        }}
                                    >
                                        {'\u00A0'}
                                        {'\u00A0'}
                                        {1}{' '}
                                        <img
                                            width={20}
                                            style={{ filter: 'grayscale(1)' }}
                                            src={
                                                'https://pbs.twimg.com/profile_images/1285714433981812736/-wuBO62N_400x400.jpg'
                                            }
                                        />
                                    </a>
                                </Tooltip>
                                <AutoMinervaViewerLink
                                    url={
                                        '/explore?selectedFilters=%5B%7B"value"%3A"H%26E"%2C"label"%3A"H%26E"%2C"group"%3A"assayName"%2C"count"%3A692%2C"isSelected"%3Afalse%7D%2C%7B"group"%3A"AtlasName"%2C"value"%3A"HTAN+Vanderbilt"%7D%5D&tab=file'
                                    }
                                    count={20}
                                />
                            </>
                        );
                    } else if (atlas.htan_name === 'HTAN WUSTL') {
                        return (
                            <>
                                <AutoMinervaViewerLink
                                    url={
                                        '/explore?selectedFilters=%5B%7B"group"%3A"AtlasName"%2C"value"%3A"HTAN+WUSTL"%7D%2C%7B"value"%3A"IMC"%2C"label"%3A"IMC"%2C"group"%3A"assayName"%2C"count"%3A78%2C"isSelected"%3Afalse%7D%2C%7B"value"%3A"H%26E"%2C"label"%3A"H%26E"%2C"group"%3A"assayName"%2C"count"%3A71%2C"isSelected"%3Afalse%7D%5D&tab=file'
                                    }
                                    count={149}
                                />
                            </>
                        );
                    } else if (atlas.htan_name === 'HTAN CHOP') {
                        return (
                            <CellxgeneViewerLink
                                url={
                                    '/explore?selectedFilters=%5B%7B"value"%3A"hdf5"%2C"label"%3A"hdf5"%2C"group"%3A"FileFormat"%2C"count"%3A11%2C"isSelected"%3Afalse%7D%2C%7B"group"%3A"AtlasName"%2C"value"%3A"HTAN+CHOP"%7D%5D&tab=file'
                                }
                                count={3}
                            />
                        );
                    } else if (atlas.htan_name === 'Brugge Lab') {
                        return (
                            <>
                                <CellxgeneViewerLink
                                    url={
                                        'https://brugge-singlecell.herokuapp.com'
                                    }
                                    count={1}
                                />
                                <BroadSingleCellPortalViewerLink
                                    url={
                                        'https://singlecell.broadinstitute.org/single_cell/study/SCP1731/'
                                    }
                                    count={1}
                                />
                            </>
                        );
                    } else if (atlas.htan_name === 'Drapkin Lab') {
                        return (
                            <CBioPortalViewerLink
                                url={
                                    'https://triage.cbioportal.mskcc.org/study/summary?id=ovarian_drapkin_2022'
                                }
                                count={1}
                            />
                        );
                    } else if (atlas.htan_name === 'Ellisen Lab') {
                        return (
                            <CBioPortalViewerLink
                                url={
                                    'https://triage.cbioportal.mskcc.org/study/summary?id=brca_ellisen_2022'
                                }
                                count={1}
                            />
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
