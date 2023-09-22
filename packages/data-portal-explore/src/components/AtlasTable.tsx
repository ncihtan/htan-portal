import _ from 'lodash';
import Tooltip from 'rc-tooltip';
import React from 'react';
import { observer } from 'mobx-react';
import { action, computed, makeObservable, observable } from 'mobx';
import classNames from 'classnames';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBook, faDownload } from '@fortawesome/free-solid-svg-icons';
import { Button, Modal } from 'react-bootstrap';

import { ISelectedFiltersByAttrName } from '../../../data-portal-filter/src/libs/types';
import EnhancedDataTable from '../../../data-portal-table/src/components/EnhancedDataTable';
import {
    Atlas,
    AtlasMetaData,
    Entity,
} from '../../../data-portal-commons/src/libs/entity';
import { getDefaultDataTableStyle } from '../../../data-portal-table/src/libs/helpers';
import { ExploreTab } from '../libs/types';

interface IAtlasTableProps {
    publications: { [id: string]: { cite: string } };
    publicationPageLink: { [id: string]: { id: string; show: boolean } };
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
}

interface IAtlasMetadataLinkModalProps {
    isOpen: boolean;
    onClose: () => void;
    atlas: Atlas | null;
    atlasMetaData: AtlasMetaData;
}

const arePublicationPagesEnabled = () => {
    const urlParams = new URLSearchParams(window.location.search);
    return (
        urlParams.has('publication') ||
        urlParams.has('publications') ||
        urlParams.has('pub') ||
        urlParams.has('qc') ||
        urlParams.has('pubs')
    );
};

const SynapseDataLink = (props: { id: string }) => (
    <a
        href={`https://www.synapse.org/#!Synapse:${props.id}/files/`}
        target={'_blank'}
    >
        {props.id}
    </a>
);

const MetaDataLink = (props: { id: string }) => (
    <a
        href={`https://htan-metadata-20230824.surge.sh/${props.id}.csv`}
        download
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
                                {_.chain(
                                    props.atlasMetaData[props.atlas.htan_id]
                                )
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
            {props.count < 1000 && '\u00A0'}
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

const BigQueryLink = (props: { url: string; count: number }) => (
    <Tooltip overlay="Explore single cell data in Google BigQuery">
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
                src={
                    'https://user-images.githubusercontent.com/2837859/179311013-a1d0046c-de21-400c-993e-32372a080be4.png'
                }
            />
        </a>
    </Tooltip>
);

const CellxgeneViewerLink = (props: { url: string; count: number }) => (
    <Tooltip overlay="cellxgene">
        <a
            href={props.url}
            target={props.url.startsWith('http') ? '_blank' : undefined}
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

type AtlasTableData = Atlas & {
    isSelected: boolean;
    publicationPageLink: { id: string; show: boolean };
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
export default class AtlasTable extends React.Component<IAtlasTableProps> {
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

    getPublicationPageLink = (atlas: Atlas) => {
        return this.props.publicationPageLink[atlas.htan_id];
    };

    // we need to update data every time the selection changes to rerender the table
    // see selectableRowSelected property at https://www.npmjs.com/package/react-data-table-component#row-selection
    @computed get data(): AtlasTableData[] {
        return (this.props.filteredAtlases || this.props.synapseAtlasData).map(
            (a) =>
                ({
                    ...a,
                    isSelected: this.isRowSelected(a),
                    publicationPageLink: this.getPublicationPageLink(a),
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
                selector: (atlas: Atlas) => atlas.htan_name,
                grow: 1.2,
                wrap: true,
                sortable: true,
            },
            {
                name: 'Atlas ID',
                selector: (atlas: Atlas) => atlas.htan_id.toUpperCase(),
                wrap: true,
                sortable: true,
                omit: true,
            },
            {
                name: 'Lead Institution',
                selector: (atlas: Atlas) => atlas.AtlasMeta.lead_institutions,
                grow: 1.6,
                wrap: true,
                sortable: true,
            },
            {
                name: 'Atlas Description',
                selector: 'AtlasMeta.title.rendered',
                format: (atlas: Atlas) =>
                    atlas.AtlasMeta &&
                    !['hta13', 'hta14', 'hta15'].includes(
                        atlas.htan_id.toLowerCase()
                    ) ? (
                        <span>
                            <a
                                href={`//${
                                    window.location.host
                                }/${atlas.htan_id.toLowerCase()}`}
                            >
                                {atlas.AtlasMeta.title.rendered}
                            </a>
                        </span>
                    ) : (
                        <span>{atlas.AtlasMeta.short_description}</span>
                    ),
                grow: 2,
                wrap: true,
                sortable: true,
            },
            {
                name: 'Publications',
                grow: 0.5,
                selector: 'publicationPageLink', // dummy selector - you need to put something or else nothing will render
                cell: (atlasTableData: AtlasTableData) => {
                    if (
                        atlasTableData.publicationPageLink &&
                        (atlasTableData.publicationPageLink.show ||
                            arePublicationPagesEnabled())
                    ) {
                        return (
                            <Tooltip
                                overlay={`${
                                    this.props.publications[
                                        atlasTableData.publicationPageLink.id
                                    ].cite
                                }`}
                            >
                                <a
                                    href={`//${window.location.host}/publications/${atlasTableData.publicationPageLink.id}`}
                                >
                                    <FontAwesomeIcon icon={faBook} />
                                </a>
                            </Tooltip>
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
                grow: 0.5,
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
                grow: 0.5,
                selector: 'num_cases',
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
            },
            {
                name: 'Biospecimens',
                selector: 'num_biospecimens',
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
                name: 'Viewers',
                selector: 'htan_id', // dummy selector - you need to put something or else nothing will render
                grow: 1.5,
                cell: (atlas: Atlas) => {
                    if (atlas.htan_name === 'HTAN MSK') {
                        return (
                            <>
                                <AutoMinervaViewerLink
                                    url={
                                        '/explore?selectedFilters=%5B%7B"group"%3A"AtlasName"%2C"value"%3A"HTAN+MSK"%7D%2C%7B"value"%3A"MIBI"%2C"label"%3A"MIBI"%2C"group"%3A"assayName"%2C"count"%3A58%2C"isSelected"%3Afalse%7D%5D&tab=file'
                                    }
                                    count={58}
                                />
                                <CellxgeneViewerLink
                                    url={
                                        '/explore?tab=file&selectedFilters=%5B%7B"value"%3A"HTAN+MSK"%2C"label"%3A"HTAN+MSK"%2C"group"%3A"AtlasName"%2C"count"%3A1086%2C"isSelected"%3Afalse%7D%2C%7B"value"%3A"hdf5"%2C"label"%3A"hdf5"%2C"group"%3A"FileFormat"%2C"count"%3A12%2C"isSelected"%3Afalse%7D%5D'
                                    }
                                    count={12}
                                />
                                <BigQueryLink
                                    url={
                                        '/explore?tab=file&selectedFilters=%5B%7B"value"%3A"HTAN+MSK"%2C"label"%3A"HTAN+MSK"%2C"group"%3A"AtlasName"%2C"count"%3A1086%2C"isSelected"%3Afalse%7D%2C%7B"value"%3A"hdf5"%2C"label"%3A"hdf5"%2C"group"%3A"FileFormat"%2C"count"%3A12%2C"isSelected"%3Afalse%7D%5D'
                                    }
                                    count={11}
                                />
                            </>
                        );
                    } else if (atlas.htan_name === 'HTAN Duke') {
                        return (
                            <>
                                <AutoMinervaViewerLink
                                    url={
                                        '/explore?selectedFilters=%5B%7B"value"%3A"mIHC"%2C"label"%3A"mIHC"%2C"group"%3A"assayName"%2C"count"%3A62%2C"isSelected"%3Afalse%7D%2C%7B"value"%3A"CyCIF"%2C"label"%3A"CyCIF"%2C"group"%3A"assayName"%2C"count"%3A400%2C"isSelected"%3Afalse%7D%2C%7B"value"%3A"MIBI"%2C"label"%3A"MIBI"%2C"group"%3A"assayName"%2C"count"%3A165%2C"isSelected"%3Afalse%7D%2C%7B"value"%3A"IMC"%2C"label"%3A"IMC"%2C"group"%3A"assayName"%2C"count"%3A41%2C"isSelected"%3Afalse%7D%2C%7B"value"%3A"H%26E"%2C"label"%3A"H%26E"%2C"group"%3A"assayName"%2C"count"%3A254%2C"isSelected"%3Afalse%7D%2C%7B"value"%3A"CyCIF"%2C"label"%3A"CyCIF"%2C"group"%3A"assayName"%2C"count"%3A13%2C"isSelected"%3Afalse%7D%2C%7B"group"%3A"AtlasName"%2C"value"%3A"HTAN+Duke"%7D%5D&tab=file'
                                    }
                                    count={1023}
                                />
                            </>
                        );
                    } else if (atlas.htan_name === 'HTAN OHSU') {
                        return (
                            <>
                                <AutoMinervaViewerLink
                                    url={
                                        '/explore?selectedFilters=%5B%7B"value"%3A"mIHC"%2C"label"%3A"mIHC"%2C"group"%3A"assayName"%2C"count"%3A94%2C"isSelected"%3Afalse%7D%2C%7B"value"%3A"CyCIF"%2C"label"%3A"CyCIF"%2C"group"%3A"assayName"%2C"count"%3A56%2C"isSelected"%3Afalse%7D%2C%7B"group"%3A"AtlasName"%2C"value"%3A"HTAN+OHSU"%7D%5D&tab=atlas'
                                    }
                                    count={149}
                                />
                                <MinervaStoryViewerLink
                                    url={
                                        'https://minerva-story-htan-ohsu-demo.surge.sh/'
                                    }
                                    count={1}
                                />
                                <CBioPortalViewerLink
                                    url={
                                        'https://www.cbioportal.org/patient?studyId=brca_hta9_htan_2022&caseId=HTA9_1'
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
                                count={659}
                            />
                        );
                    } else if (atlas.htan_name === 'HTAN BU') {
                        return (
                            <>
                                <CellxgeneViewerLink
                                    url={
                                        'https://cellxgene.cziscience.com/d/BFAA0C46-7E34-4FA9-B08C-6DC6013B735A.cxg/'
                                    }
                                    count={1}
                                />
                            </>
                        );
                    } else if (atlas.htan_name === 'HTAN Vanderbilt') {
                        return (
                            <>
                                <AutoMinervaViewerLink
                                    url={
                                        '/explore?selectedFilters=%5B%7B"value"%3A"H%26E"%2C"label"%3A"H%26E"%2C"group"%3A"assayName"%2C"count"%3A692%2C"isSelected"%3Afalse%7D%2C%7B"group"%3A"AtlasName"%2C"value"%3A"HTAN+Vanderbilt"%7D%2C%7B"value"%3A"MxIF"%2C"label"%3A"MxIF"%2C"group"%3A"assayName"%2C"count"%3A93%2C"isSelected"%3Afalse%7D%5D&tab=file'
                                    }
                                    count={123}
                                />
                                <CellxgeneViewerLink
                                    url={
                                        'https://cellxgene.cziscience.com/collections/a48f5033-3438-4550-8574-cdff3263fdfd'
                                    }
                                    count={3}
                                />
                                <BigQueryLink
                                    url={
                                        '/explore?selectedFilters=%5B%7B"value"%3A"hdf5"%2C"label"%3A"hdf5"%2C"group"%3A"FileFormat"%2C"count"%3A11%2C"isSelected"%3Afalse%7D%2C%7B"value"%3A"HTAN+Vanderbilt"%2C"label"%3A"HTAN+Vanderbilt"%2C"group"%3A"AtlasName"%2C"count"%3A4%2C"isSelected"%3Afalse%7D%5D&tab=file'
                                    }
                                    count={4}
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
                                    count={150}
                                />
                            </>
                        );
                    } else if (atlas.htan_name === 'HTAN CHOP') {
                        return (
                            <>
                                <CellxgeneViewerLink
                                    url={
                                        '/explore?selectedFilters=%5B%7B"value"%3A"hdf5"%2C"label"%3A"hdf5"%2C"group"%3A"FileFormat"%2C"count"%3A11%2C"isSelected"%3Afalse%7D%2C%7B"group"%3A"AtlasName"%2C"value"%3A"HTAN+CHOP"%7D%5D&tab=file'
                                    }
                                    count={1}
                                />
                                <BigQueryLink
                                    url={
                                        'explore?selectedFilters=%5B%7B%22value%22%3A%22hdf5%22%2C%22label%22%3A%22hdf5%22%2C%22group%22%3A%22FileFormat%22%2C%22count%22%3A11%2C%22isSelected%22%3Afalse%7D%2C%7B%22group%22%3A%22AtlasName%22%2C%22value%22%3A%22HTAN+CHOP%22%7D%5D&tab=file'
                                    }
                                    count={3}
                                />
                            </>
                        );
                    } else if (atlas.htan_name === 'HTAN TNP - TMA') {
                        return (
                            <>
                                <AutoMinervaViewerLink
                                    url={
                                        '/explore?selectedFilters=%5B%7B"group"%3A"AtlasName"%2C"value"%3A"HTAN+TNP+-+TMA"%7D%2C%7B"value"%3A"CODEX"%2C"label"%3A"CODEX"%2C"group"%3A"assayName"%2C"count"%3A13%2C"isSelected"%3Afalse%7D%2C%7B"value"%3A"CyCIF"%2C"label"%3A"CyCIF"%2C"group"%3A"assayName"%2C"count"%3A1250%2C"isSelected"%3Afalse%7D%2C%7B"value"%3A"H%26E"%2C"label"%3A"H%26E"%2C"group"%3A"assayName"%2C"count"%3A32%2C"isSelected"%3Afalse%7D%2C%7B"value"%3A"HI-C-seq"%2C"label"%3A"HI-C-seq"%2C"group"%3A"assayName"%2C"count"%3A102%2C"isSelected"%3Afalse%7D%2C%7B"value"%3A"MIBI"%2C"label"%3A"MIBI"%2C"group"%3A"assayName"%2C"count"%3A175%2C"isSelected"%3Afalse%7D%2C%7B"value"%3A"SABER"%2C"label"%3A"SABER"%2C"group"%3A"assayName"%2C"count"%3A6%2C"isSelected"%3Afalse%7D%2C%7B"value"%3A"mIHC"%2C"label"%3A"mIHC"%2C"group"%3A"assayName"%2C"count"%3A403%2C"isSelected"%3Afalse%7D%5D&tab=file'
                                    }
                                    count={1293}
                                />
                            </>
                        );
                    } else if (atlas.htan_name === 'HTAN TNP SARDANA') {
                        return (
                            <>
                                <AutoMinervaViewerLink
                                    url={
                                        '/explore?selectedFilters=%5B%7B"group"%3A"AtlasName"%2C"value"%3A"HTAN+TNP+SARDANA"%7D%2C%7B"value"%3A"OME-TIFF"%2C"label"%3A"OME-TIFF"%2C"group"%3A"FileFormat"%2C"count"%3A276%2C"isSelected"%3Afalse%7D%5D&tab=file'
                                    }
                                    count={276}
                                />
                            </>
                        );
                    } else if (atlas.htan_name === 'HTAN HTAPP') {
                        return (
                            <>
                                <AutoMinervaViewerLink
                                    url={
                                        '/explore?selectedFilters=%5B%7B"group"%3A"AtlasName"%2C"value"%3A"HTAN+HTAPP"%7D%2C%7B"value"%3A"H%26E"%2C"label"%3A"H%26E"%2C"group"%3A"assayName"%2C"count"%3A10%2C"isSelected"%3Afalse%7D%2C%7B"value"%3A"MIBI"%2C"label"%3A"MIBI"%2C"group"%3A"assayName"%2C"count"%3A117%2C"isSelected"%3Afalse%7D%5D&tab=file'
                                    }
                                    count={127}
                                />
                            </>
                        );
                    } else {
                        return null;
                    }
                },
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
                />
            </>
        );
    }
}
