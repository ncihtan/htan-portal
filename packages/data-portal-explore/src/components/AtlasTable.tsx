import _ from 'lodash';
import Tooltip from 'rc-tooltip';
import React from 'react';
import { observer } from 'mobx-react';
import { action, computed, makeObservable, observable } from 'mobx';
import classNames from 'classnames';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBook, faDownload } from '@fortawesome/free-solid-svg-icons';
import { Button, Modal } from 'react-bootstrap';

import { ISelectedFiltersByAttrName } from '@htan/data-portal-filter';
import {
    EnhancedDataTable,
    getDefaultDataTableStyle,
} from '@htan/data-portal-table';
import {
    Atlas,
    AtlasDescription,
    AtlasMetaData,
    Entity,
    getCiteFromPublicationManifest,
    getPublicationUid,
    PublicationManifest,
} from '@htan/data-portal-commons';
import { ExploreTab } from '../lib/types';

interface IAtlasTableProps {
    publications: PublicationManifest[];
    getAtlasMetaData: () => AtlasMetaData;
    setTab: (tab: ExploreTab) => void;
    synapseAtlasData: Atlas[];
    selectedAtlases?: Atlas[];
    filteredAtlases?: Atlas[];
    onSelectAtlas?: (selected: Atlas[]) => void;
    selectedFiltersByAttrName: ISelectedFiltersByAttrName;
    filteredCases: Entity[];
    filteredBiospecimens: Entity[];
    files: Entity[];
    filteredFiles: Entity[];
    cloudBaseUrl: string;
}

interface IAtlasMetadataLinkModalProps {
    isOpen: boolean;
    onClose: () => void;
    atlas: Atlas | null;
    atlasMetaData: AtlasMetaData;
    cloudBaseUrl: string;
}

const MetaDataLink = (props: { id: string; baseUrl: string }) => (
    <a href={`${props.baseUrl}/metadata/${props.id}.csv`} download>
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
                                {_.chain(
                                    props.atlasMetaData[props.atlas.htan_id]
                                )
                                    .map((info) => ({
                                        row: (
                                            <tr>
                                                <td>
                                                    <MetaDataLink
                                                        id={info.synapseId}
                                                        baseUrl={
                                                            props.cloudBaseUrl
                                                        }
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
                        <span>
                            You can also explore the metadata in{' '}
                            <a
                                target="_blank"
                                href="https://isb-cgc.appspot.com/bq_meta_search/isb-cgc-bq.HTAN/"
                            >
                                Google BigQuery
                            </a>
                            .
                        </span>
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

type AtlasTableData = Atlas & {
    isSelected: boolean;
    publicationManifests: PublicationManifest[];
};

function filteredCount(
    atlas: Atlas,
    shouldShowFilteredFractions: boolean,
    filteredDataByAtlas: { [atlasId: string]: any }
) {
    return shouldShowFilteredFractions
        ? `${(filteredDataByAtlas[atlas.htan_id] || []).length}/`
        : '';
}

@observer
export class AtlasTable extends React.Component<IAtlasTableProps> {
    @observable metadataModalAtlas: Atlas | null = null;
    atlasMetaData: AtlasMetaData;
    @computed
    get selectedAtlases() {
        return _.keyBy(this.props.selectedAtlases || [], (a) => a.htan_id);
    }

    @computed get hasAtlasesSelected() {
        return (this.props.selectedAtlases || []).length > 0;
    }

    constructor(props: IAtlasTableProps) {
        super(props);
        makeObservable(this);
        this.atlasMetaData = this.props.getAtlasMetaData();
    }

    isRowSelected = (atlas: Atlas) => {
        return this.selectedAtlases[atlas.htan_id] !== undefined;
    };

    getPublicationManifests = (atlas: Atlas) => {
        return this.props.publications.filter(
            (p) => p.atlasid === atlas.htan_id
        );
    };

    // we need to update data every time the selection changes to rerender the table
    // see selectableRowSelected property at https://www.npmjs.com/package/react-data-table-component#row-selection
    @computed get data(): AtlasTableData[] {
        return (this.props.filteredAtlases || this.props.synapseAtlasData).map(
            (a) =>
                ({
                    ...a,
                    isSelected: this.isRowSelected(a),
                    publicationManifests: this.getPublicationManifests(a),
                } as AtlasTableData)
        );
    }

    @computed get filesByAtlas() {
        return _.groupBy(this.props.files, (c: Entity) => c.atlasid);
    }

    @computed get assaysByAtlas() {
        return _.mapValues(this.filesByAtlas, (files) =>
            _(files)
                .map((file) => file.assayName)
                .uniq()
                .value()
        );
    }

    @computed get filteredAssaysByAtlas() {
        return _.mapValues(this.filteredFilesByAtlas, (files) =>
            _(files)
                .map((file) => file.assayName)
                .uniq()
                .value()
        );
    }

    @computed get filteredFilesByAtlas() {
        return _.groupBy(this.props.filteredFiles, (c: Entity) => c.atlasid);
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
                selector: (atlas: Atlas) =>
                    atlas.htan_name.replace('HTAN ', '').replace(' - ', ' '),
                grow: 0.6,
                minWidth: '50',
                wrap: true,
                sortable: true,
            },
            {
                name: 'Atlas ID',
                selector: (atlas: Atlas) => atlas.htan_id?.toUpperCase(),
                wrap: true,
                sortable: true,
                omit: true,
            },
            {
                name: 'Lead Institution',
                selector: (atlas: Atlas) => atlas.AtlasMeta?.lead_institutions,
                grow: 1.6,
                wrap: true,
                sortable: true,
                omit: true,
            },
            {
                name: 'Atlas Description',
                selector: (atlas: Atlas) => atlas.AtlasMeta?.title?.rendered,
                format: (atlas: Atlas) =>
                    atlas.AtlasMeta && (
                        <AtlasDescription atlasMeta={atlas.AtlasMeta} />
                    ),
                grow: 2,
                wrap: true,
                sortable: true,
            },
            {
                name: 'Publications',
                grow: 0.5,
                selector: 'publication', // dummy selector - you need to put something or else nothing will render
                cell: (atlasTableData: AtlasTableData) => {
                    if (atlasTableData.publicationManifests.length > 0) {
                        return atlasTableData.publicationManifests.map(
                            (publicationManifest) => (
                                <Tooltip
                                    overlay={getCiteFromPublicationManifest(
                                        publicationManifest
                                    )}
                                    key={getPublicationUid(publicationManifest)}
                                >
                                    <a
                                        href={`//${
                                            window.location.host
                                        }/publications/${getPublicationUid(
                                            publicationManifest
                                        )}`}
                                        key={getPublicationUid(
                                            publicationManifest
                                        )}
                                        style={{ paddingRight: 3 }}
                                    >
                                        <FontAwesomeIcon icon={faBook} />
                                    </a>
                                </Tooltip>
                            )
                        );
                    } else {
                        return (
                            <Tooltip overlay={`Publication Page Coming Soon`}>
                                <a
                                    href="/publications"
                                    style={{ filter: 'grayscale(1)' }}
                                >
                                    <FontAwesomeIcon icon={faBook} />
                                </a>
                            </Tooltip>
                        );
                    }
                },
            },
            {
                name: 'Metadata',
                grow: 0.1,
                selector: 'htan_id', // dummy selector - you need to put something or else nothing will render
                cell: (atlas: Atlas) => {
                    if (atlas.htan_id in this.atlasMetaData) {
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
                selector: 'num_cases',
                grow: 0.01,
                cell: (atlas: Atlas) => (
                    <span className="ml-auto">
                        {filteredCount(
                            atlas,
                            this.shouldShowFilteredFractions,
                            this.filteredCasesByAtlas
                        )}
                        {atlas.num_cases}
                    </span>
                ),
                sortable: true,
                right: true,
            },
            {
                name: 'Biospecimens',
                selector: 'num_biospecimens',
                grow: 0.7,
                right: true,
                cell: (atlas: Atlas) => (
                    <span className="ml-auto">
                        {filteredCount(
                            atlas,
                            this.shouldShowFilteredFractions,
                            this.filteredBiospecimensByAtlas
                        )}
                        {atlas.num_biospecimens}
                    </span>
                ),
                style: {
                    verticalAlgin: 'top',
                },
                sortable: true,
            },
            {
                name: 'Assays',
                grow: 0.5,
                selector: 'num_assays', // dummy selector, there is no num_assays field
                cell: (atlas: Atlas) => (
                    <span className="ml-auto">
                        {filteredCount(
                            atlas,
                            this.shouldShowFilteredFractions,
                            this.filteredAssaysByAtlas
                        )}
                        {(this.assaysByAtlas[atlas.htan_id] || []).length}
                    </span>
                ),
                sortable: true,
                omit: true,
            },
            {
                name: 'Files',
                right: true,
                grow: 0.6,
                selector: 'num_files', // dummy selector, there is no num_files field
                cell: (atlas: Atlas) => (
                    <span className="ml-auto">
                        {filteredCount(
                            atlas,
                            this.shouldShowFilteredFractions,
                            this.filteredFilesByAtlas
                        )}
                        {(this.filesByAtlas[atlas.htan_id] || []).length}
                    </span>
                ),
                sortable: true,
                omit: true,
            },
            {
                name: (
                    <>
                        <Tooltip overlay="Autominerva: explore autogenerated views for imaging data">
                            <span className="ml-auto">
                                <img
                                    width={20}
                                    src={
                                        'https://user-images.githubusercontent.com/1334004/159789346-b647c772-48fe-4652-8d2b-3eecf6690f1f.png'
                                    }
                                    style={{
                                        float: 'right',
                                    }}
                                />
                            </span>
                        </Tooltip>
                    </>
                ),
                id: 'Autominerva',
                selector: 'htan_id', // dummy selector - you need to put something or else nothing will render
                grow: 0.5,
                right: true,
                minWidth: '50',
                cell: (atlas: Atlas) => (
                    <>
                        <Tooltip overlay="Autominerva: explore autogenerated views for imaging data">
                            <span className="ml-auto">
                                {(atlas.htan_name === 'HTAN HTAPP' && (
                                    <a
                                        href="/explore?selectedFilters=%5B%7B%22group%22%3A%22AtlasName%22%2C%22value%22%3A%22HTAN+HTAPP%22%7D%2C%7B%22value%22%3A%22H%26E%22%2C%22label%22%3A%22H%26E%22%2C%22group%22%3A%22assayName%22%2C%22count%22%3A10%2C%22isSelected%22%3Afalse%7D%2C%7B%22value%22%3A%22MIBI%22%2C%22label%22%3A%22MIBI%22%2C%22group%22%3A%22assayName%22%2C%22count%22%3A117%2C%22isSelected%22%3Afalse%7D%5D&tab=file"
                                        target="_blank"
                                    >
                                        127
                                    </a>
                                )) ||
                                    (atlas.htan_name === 'HTAN Duke' && (
                                        <a
                                            href="/explore?selectedFilters=%5B%7B%22value%22%3A%22mIHC%22%2C%22label%22%3A%22mIHC%22%2C%22group%22%3A%22assayName%22%2C%22count%22%3A62%2C%22isSelected%22%3Afalse%7D%2C%7B%22value%22%3A%22CyCIF%22%2C%22label%22%3A%22CyCIF%22%2C%22group%22%3A%22assayName%22%2C%22count%22%3A400%2C%22isSelected%22%3Afalse%7D%2C%7B%22value%22%3A%22MIBI%22%2C%22label%22%3A%22MIBI%22%2C%22group%22%3A%22assayName%22%2C%22count%22%3A165%2C%22isSelected%22%3Afalse%7D%2C%7B%22value%22%3A%22IMC%22%2C%22label%22%3A%22IMC%22%2C%22group%22%3A%22assayName%22%2C%22count%22%3A41%2C%22isSelected%22%3Afalse%7D%2C%7B%22value%22%3A%22H%26E%22%2C%22label%22%3A%22H%26E%22%2C%22group%22%3A%22assayName%22%2C%22count%22%3A254%2C%22isSelected%22%3Afalse%7D%2C%7B%22value%22%3A%22CyCIF%22%2C%22label%22%3A%22CyCIF%22%2C%22group%22%3A%22assayName%22%2C%22count%22%3A13%2C%22isSelected%22%3Afalse%7D%2C%7B%22group%22%3A%22AtlasName%22%2C%22value%22%3A%22HTAN+Duke%22%7D%5D&tab=file"
                                            target="_blank"
                                        >
                                            1023
                                        </a>
                                    )) ||
                                    (atlas.htan_name === 'HTAN HMS' && (
                                        <a
                                            href="/explore?selectedFilters=%5B%7B%22group%22%3A%22AtlasName%22%2C%22value%22%3A%22HTAN+HMS%22%7D%2C%7B%22value%22%3A%22OME-TIFF%22%2C%22label%22%3A%22OME-TIFF%22%2C%22group%22%3A%22FileFormat%22%2C%22count%22%3A16%2C%22isSelected%22%3Afalse%7D%5D&tab=file"
                                            target="_blank"
                                        >
                                            659
                                        </a>
                                    )) ||
                                    (atlas.htan_name === 'HTAN MSK' && (
                                        <a
                                            href="/explore?selectedFilters=%5B%7B%22group%22%3A%22AtlasName%22%2C%22value%22%3A%22HTAN+MSK%22%7D%2C%7B%22value%22%3A%22MIBI%22%2C%22label%22%3A%22MIBI%22%2C%22group%22%3A%22assayName%22%2C%22count%22%3A58%2C%22isSelected%22%3Afalse%7D%5D&tab=file"
                                            target="_blank"
                                        >
                                            58
                                        </a>
                                    )) ||
                                    (atlas.htan_name === 'HTAN OHSU' && (
                                        <a
                                            href="/explore?selectedFilters=%5B%7B%22value%22%3A%22mIHC%22%2C%22label%22%3A%22mIHC%22%2C%22group%22%3A%22assayName%22%2C%22count%22%3A94%2C%22isSelected%22%3Afalse%7D%2C%7B%22value%22%3A%22CyCIF%22%2C%22label%22%3A%22CyCIF%22%2C%22group%22%3A%22assayName%22%2C%22count%22%3A56%2C%22isSelected%22%3Afalse%7D%2C%7B%22group%22%3A%22AtlasName%22%2C%22value%22%3A%22HTAN+OHSU%22%7D%5D&tab=atlas"
                                            target="_blank"
                                        >
                                            149
                                        </a>
                                    )) ||
                                    (atlas.htan_name === 'HTAN TNP - TMA' && (
                                        <a
                                            href="/explore?selectedFilters=%5B%7B%22group%22%3A%22AtlasName%22%2C%22value%22%3A%22HTAN+TNP+-+TMA%22%7D%2C%7B%22value%22%3A%22CODEX%22%2C%22label%22%3A%22CODEX%22%2C%22group%22%3A%22assayName%22%2C%22count%22%3A13%2C%22isSelected%22%3Afalse%7D%2C%7B%22value%22%3A%22CyCIF%22%2C%22label%22%3A%22CyCIF%22%2C%22group%22%3A%22assayName%22%2C%22count%22%3A1250%2C%22isSelected%22%3Afalse%7D%2C%7B%22value%22%3A%22H%26E%22%2C%22label%22%3A%22H%26E%22%2C%22group%22%3A%22assayName%22%2C%22count%22%3A32%2C%22isSelected%22%3Afalse%7D%2C%7B%22value%22%3A%22HI-C-seq%22%2C%22label%22%3A%22HI-C-seq%22%2C%22group%22%3A%22assayName%22%2C%22count%22%3A102%2C%22isSelected%22%3Afalse%7D%2C%7B%22value%22%3A%22MIBI%22%2C%22label%22%3A%22MIBI%22%2C%22group%22%3A%22assayName%22%2C%22count%22%3A175%2C%22isSelected%22%3Afalse%7D%2C%7B%22value%22%3A%22SABER%22%2C%22label%22%3A%22SABER%22%2C%22group%22%3A%22assayName%22%2C%22count%22%3A6%2C%22isSelected%22%3Afalse%7D%2C%7B%22value%22%3A%22mIHC%22%2C%22label%22%3A%22mIHC%22%2C%22group%22%3A%22assayName%22%2C%22count%22%3A403%2C%22isSelected%22%3Afalse%7D%5D&tab=file"
                                            target="_blank"
                                        >
                                            1293
                                        </a>
                                    )) ||
                                    (atlas.htan_name === 'HTAN TNP SARDANA' && (
                                        <a
                                            href="/explore?selectedFilters=%5B%7B%22group%22%3A%22AtlasName%22%2C%22value%22%3A%22HTAN+TNP+SARDANA%22%7D%2C%7B%22value%22%3A%22OME-TIFF%22%2C%22label%22%3A%22OME-TIFF%22%2C%22group%22%3A%22FileFormat%22%2C%22count%22%3A276%2C%22isSelected%22%3Afalse%7D%5D&tab=file"
                                            target="_blank"
                                        >
                                            276
                                        </a>
                                    )) ||
                                    (atlas.htan_name === 'HTAN Vanderbilt' && (
                                        <a
                                            href="/explore?selectedFilters=%5B%7B%22value%22%3A%22H%26E%22%2C%22label%22%3A%22H%26E%22%2C%22group%22%3A%22assayName%22%2C%22count%22%3A692%2C%22isSelected%22%3Afalse%7D%2C%7B%22group%22%3A%22AtlasName%22%2C%22value%22%3A%22HTAN+Vanderbilt%22%7D%2C%7B%22value%22%3A%22MxIF%22%2C%22label%22%3A%22MxIF%22%2C%22group%22%3A%22assayName%22%2C%22count%22%3A93%2C%22isSelected%22%3Afalse%7D%5D&tab=file"
                                            target="_blank"
                                        >
                                            123
                                        </a>
                                    )) ||
                                    (atlas.htan_name === 'HTAN WUSTL' && (
                                        <a
                                            href="/explore?selectedFilters=%5B%7B%22group%22%3A%22AtlasName%22%2C%22value%22%3A%22HTAN+WUSTL%22%7D%2C%7B%22value%22%3A%22IMC%22%2C%22label%22%3A%22IMC%22%2C%22group%22%3A%22assayName%22%2C%22count%22%3A78%2C%22isSelected%22%3Afalse%7D%2C%7B%22value%22%3A%22H%26E%22%2C%22label%22%3A%22H%26E%22%2C%22group%22%3A%22assayName%22%2C%22count%22%3A71%2C%22isSelected%22%3Afalse%7D%5D&tab=file"
                                            target="_blank"
                                        >
                                            150
                                        </a>
                                    ))}
                            </span>
                        </Tooltip>
                    </>
                ),
            },
            {
                name: (
                    <>
                        <Tooltip overlay="Minerva Story: explore curated stories for imaging data">
                            <span className="ml-auto">
                                <img
                                    width={20}
                                    src={
                                        'https://user-images.githubusercontent.com/1334004/156241219-a3062991-ba9d-4201-ad87-3c9c1f0c61d8.png'
                                    }
                                />
                            </span>
                        </Tooltip>
                    </>
                ),
                id: 'Minerva Story',
                selector: 'htan_id', // dummy selector - you need to put something or else nothing will render
                grow: 0.1,
                right: true,
                minWidth: '5',
                cell: (atlas: Atlas) => (
                    <>
                        <Tooltip overlay="Minerva Story">
                            <span className="ml-auto">
                                {atlas.htan_name === 'HTAN OHSU' && (
                                    <a
                                        href="https://minerva-story-htan-ohsu-demo.surge.sh/"
                                        target="_blank"
                                    >
                                        1
                                    </a>
                                )}
                            </span>
                        </Tooltip>
                    </>
                ),
            },
            {
                name: (
                    <>
                        <Tooltip overlay="CellxGene: explore single cell data">
                            <span className="ml-auto">
                                <img
                                    width={20}
                                    src={
                                        'https://pbs.twimg.com/profile_images/1285714433981812736/-wuBO62N_400x400.jpg'
                                    }
                                />
                            </span>
                        </Tooltip>
                    </>
                ),
                id: 'CellxGene',
                selector: 'htan_id', // dummy selector - you need to put something or else nothing will render
                grow: 0.1,
                right: true,
                minWidth: '10',
                cell: (atlas: Atlas) => (
                    <>
                        <Tooltip overlay="CellxGene: explore single cell data">
                            <span className="ml-auto" style={{wordBreak:"normal"}}>
                                {(atlas.htan_name === 'HTAN MSK' && (
                                    <a
                                        href='/explore?tab=file&selectedFilters=%5B%7B"value"%3A"HTAN+MSK"%2C"label"%3A"HTAN+MSK"%2C"group"%3A"AtlasName"%2C"count"%3A1086%2C"isSelected"%3Afalse%7D%2C%7B"value"%3A"hdf5"%2C"label"%3A"hdf5"%2C"group"%3A"FileFormat"%2C"count"%3A12%2C"isSelected"%3Afalse%7D%5D'
                                        target="_blank"
                                    >
                                        12
                                    </a>
                                )) ||
                                    (atlas.htan_name === 'HTAN Vanderbilt' && (
                                        <a
                                            href="https://cellxgene.cziscience.com/collections/a48f5033-3438-4550-8574-cdff3263fdfd"
                                            target="_blank"
                                        >
                                            3
                                        </a>
                                    )) ||
                                    (atlas.htan_name === 'HTAN BU' && (
                                        <a
                                            href="https://cellxgene.cziscience.com/d/BFAA0C46-7E34-4FA9-B08C-6DC6013B735A.cxg/"
                                            target="_blank"
                                        >
                                            1
                                        </a>
                                    )) ||
                                    (atlas.htan_name === 'HTAN CHOP' && (
                                        <a
                                            href='/explore?selectedFilters=%5B%7B"value"%3A"hdf5"%2C"label"%3A"hdf5"%2C"group"%3A"FileFormat"%2C"count"%3A11%2C"isSelected"%3Afalse%7D%2C%7B"group"%3A"AtlasName"%2C"value"%3A"HTAN+CHOP"%7D%5D&tab=file'
                                            target="_blank"
                                        >
                                            1
                                        </a>
                                    ))}
                            </span>
                        </Tooltip>
                    </>
                ),
            },

            {
                name: (
                    <>
                        <Tooltip overlay="ISB-CGC BigQuery: explore single cell data in Google BigQuery">
                            <span className="ml-auto">
                                <img
                                    width={20}
                                    src={
                                        'https://user-images.githubusercontent.com/2837859/179311013-a1d0046c-de21-400c-993e-32372a080be4.png'
                                    }
                                />
                            </span>
                        </Tooltip>
                    </>
                ),
                id: 'ISB-CGC BigQuery',
                selector: 'htan_id', // dummy selector - you need to put something or else nothing will render
                grow: 0.1,
                right: true,
                minWidth: '10',
                cell: (atlas: Atlas) => (
                    <>
                        <Tooltip overlay="ISB-CGC BigQuery: explore single cell data in Google BigQuery">
                            <span className="ml-auto">
                                {(atlas.htan_name === 'HTAN CHOP' && (
                                    <a
                                        href="/explore?selectedFilters=%5B%7B%22value%22%3A%22hdf5%22%2C%22label%22%3A%22hdf5%22%2C%22group%22%3A%22FileFormat%22%2C%22count%22%3A11%2C%22isSelected%22%3Afalse%7D%2C%7B%22group%22%3A%22AtlasName%22%2C%22value%22%3A%22HTAN+CHOP%22%7D%5D&tab=file"
                                        target="_blank"
                                    >
                                        3
                                    </a>
                                )) ||
                                    (atlas.htan_name === 'HTAN MSK' && (
                                        <a
                                            href="/explore?tab=file&selectedFilters=%5B%7B%22value%22%3A%22HTAN+MSK%22%2C%22label%22%3A%22HTAN+MSK%22%2C%22group%22%3A%22AtlasName%22%2C%22count%22%3A1086%2C%22isSelected%22%3Afalse%7D%2C%7B%22value%22%3A%22hdf5%22%2C%22label%22%3A%22hdf5%22%2C%22group%22%3A%22FileFormat%22%2C%22count%22%3A12%2C%22isSelected%22%3Afalse%7D%5D"
                                            target="_blank"
                                        >
                                            11
                                        </a>
                                    )) ||
                                    (atlas.htan_name === 'HTAN Vanderbilt' && (
                                        <a
                                            href="/explore?selectedFilters=%5B%7B%22value%22%3A%22hdf5%22%2C%22label%22%3A%22hdf5%22%2C%22group%22%3A%22FileFormat%22%2C%22count%22%3A11%2C%22isSelected%22%3Afalse%7D%2C%7B%22value%22%3A%22HTAN+Vanderbilt%22%2C%22label%22%3A%22HTAN+Vanderbilt%22%2C%22group%22%3A%22AtlasName%22%2C%22count%22%3A4%2C%22isSelected%22%3Afalse%7D%5D&tab=file"
                                            target="_blank"
                                        >
                                            4
                                        </a>
                                    ))}
                            </span>
                        </Tooltip>
                    </>
                ),
            },
            {
                name: (
                    <>
                        <Tooltip overlay="UCSC Xena: explore single cell and imaging data">
                            <span className="ml-auto">
                                <img
                                    width={20}
                                    src={
                                        'https://xena.ucsc.edu/icons-9ac0cb8372f662ad72d747b981120f73/favicon-48x48.png'
                                    }
                                />
                            </span>
                        </Tooltip>
                    </>
                ),
                id: 'UCSC Xena',
                selector: 'htan_id', // dummy selector - you need to put something or else nothing will render
                grow: 0.1,
                right: true,
                minWidth: '10',
                cell: (atlas: Atlas) => (
                    <>
                        <Tooltip overlay="UCSC Xena: explore single cell and imaging data">
                            <span className="ml-auto">
                                {(atlas.htan_name === 'HTAN HMS' && (
                                    <a
                                        href="https://beta.xenabrowser.net/singlecell/?hub=https://previewsinglecell.xenahubs.net:443&defaultTable=htan"
                                        target="_blank"
                                    >
                                        11
                                    </a>
                                )) ||
                                    (atlas.htan_name === 'HTAN MSK' && (
                                        <a
                                            href="https://beta.xenabrowser.net/singlecell/?hub=https://previewsinglecell.xenahubs.net:443&defaultTable=htan&study=msk_sclc_chan_2021"
                                            target="_blank"
                                        >
                                            3
                                        </a>
                                    ))}
                            </span>
                        </Tooltip>
                    </>
                ),
            },
            {
                name: (
                    <>
                        <Tooltip
                            overlay={
                                <>cBioPortal: explore multimodal cancer data</>
                            }
                        >
                            <img
                                width={20}
                                src={
                                    'https://avatars.githubusercontent.com/u/9876251?s=20&v=4'
                                }
                            />
                        </Tooltip>
                    </>
                ),
                id: 'cBioPortal: explore multimodal cancer data',
                selector: 'htan_id', // dummy selector - you need to put something or else nothing will render
                grow: 0.1,
                right: true,
                minWidth: '10',
                cell: (atlas: Atlas) => (
                    <>
                        <Tooltip overlay="cBioPortal: explore multimodal cancer data">
                            <span className="ml-auto">
                                {(atlas.htan_name === 'HTAN OHSU' && (
                                    <a
                                        href="https://www.cbioportal.org/patient?studyId=brca_hta9_htan_2022&caseId=HTA9_1"
                                        target="_blank"
                                    >
                                        1
                                    </a>
                                )) ||
                                    (atlas.htan_name === 'HTAN Vanderbilt' && (
                                        <a
                                            href="https://www.cbioportal.org/study/summary?id=crc_hta11_htan_2021"
                                            target="_blank"
                                        >
                                            1
                                        </a>
                                    ))}
                            </span>
                        </Tooltip>
                    </>
                ),
            },
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
        this.props.setTab(ExploreTab.FILE);
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
                    defaultSortField={'AtlasMeta.lead_institutions'}
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
                    atlasMetaData={this.atlasMetaData}
                    // TODO get this from a prop
                    cloudBaseUrl={this.props.cloudBaseUrl}
                />
            </>
        );
    }
}

export default AtlasTable;
