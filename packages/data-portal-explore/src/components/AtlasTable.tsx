import _ from 'lodash';
import Tooltip from 'rc-tooltip';
import React from 'react';
import { observer } from 'mobx-react';
import { action, makeObservable, observable } from 'mobx';
import classNames from 'classnames';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBook, faDownload } from '@fortawesome/free-solid-svg-icons';
import { Button, Modal } from 'react-bootstrap';

import {
    ISelectedFiltersByAttrName,
    urlEncodeSelectedFilters,
} from '@htan/data-portal-filter';
import {
    EnhancedDataTable,
    getDefaultDataTableStyle,
} from '@htan/data-portal-table';
import {
    Atlas,
    AtlasDescription,
    AtlasMetaData,
    Entity,
    FileViewerName,
    getViewerValues,
    isManuscriptInReview,
    PublicationIcon,
    PublicationManifest,
} from '@htan/data-portal-commons';
import { ExploreTab } from '../lib/types';

interface IAtlasTableProps {
    publications: PublicationManifest[];
    getAtlasMetaData: () => AtlasMetaData;
    setTab: (tab: ExploreTab) => void;
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

interface IAtlasViewerCountProps {
    atlas: AtlasTableData;
    fileViewerName: FileViewerName;
    tooltipContent: string | JSX.Element;
    hrefOverride?: { [atlasName: string]: string };
}

type ViewerCountByAtlas = {
    [atlasId: string]: { [name in FileViewerName]: number };
};

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
                                href="https://bq-search.isb-cgc.org/search?datasetId=%22htan%22&projectId=isb-cgc-bq"
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

const ViewerCount: React.FunctionComponent<IAtlasViewerCountProps> = (
    props
) => {
    const count = props.atlas.viewerCounts?.[props.fileViewerName];
    const filterString = urlEncodeSelectedFilters([
        { group: 'viewersArr', value: props.fileViewerName },
        { group: 'AtlasName', value: props.atlas.htan_name },
    ]);
    const defaultHref = `/explore?selectedFilters=${filterString}&tab=file`;
    const hrefOverride = props.hrefOverride?.[props.atlas.htan_name];

    return (
        <>
            <Tooltip overlay={props.tooltipContent}>
                <span className="ml-auto" style={{ wordBreak: 'normal' }}>
                    {count > 0 && (
                        <a href={hrefOverride || defaultHref} target="_blank">
                            {count}
                        </a>
                    )}
                </span>
            </Tooltip>
        </>
    );
};

type AtlasTableData = Atlas & {
    isSelected: boolean;
    publicationManifests: PublicationManifest[];
    viewerCounts: { [name in FileViewerName]: number };
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

    get selectedAtlases() {
        return _.keyBy(this.props.selectedAtlases || [], (a) => a.htan_id);
    }

    get hasAtlasesSelected() {
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
        return _(this.props.publications)
            .filter(
                (p) => !isManuscriptInReview(p) && p.atlasid === atlas.htan_id
            )
            .sortBy([(p) => p.YearofPublication, (p) => p.PMID])
            .value();
    };

    getViewerCounts = (
        atlas: Atlas,
        filesByAtlas: { [atlasId: string]: Entity[] }
    ) => {
        return _(filesByAtlas[atlas.htan_id])
            .map((file) => getViewerValues(file))
            .flatten()
            .countBy()
            .value();
    };

    getData(
        filteredAtlases: Atlas[] | undefined,
        filteredFilesByAtlas: { [atlasId: string]: Entity[] }
    ): AtlasTableData[] {
        return (
            filteredAtlases?.map(
                (a) =>
                    ({
                        ...a,
                        isSelected: this.isRowSelected(a),
                        publicationManifests: this.getPublicationManifests(a),
                        viewerCounts: this.getViewerCounts(
                            a,
                            filteredFilesByAtlas
                        ),
                    } as AtlasTableData)
            ) || []
        );
    }

    getFilesByAtlas(files: Entity[]) {
        return _.groupBy(files, (c: Entity) => c.atlasid);
    }

    getAssaysByAtlas(filesByAtlas: { [atlasId: string]: Entity[] }) {
        return _.mapValues(filesByAtlas, (files) =>
            _(files)
                .map((file) => file.assayName)
                .uniq()
                .compact()
                .value()
        );
    }

    getCasesByAtlas(cases: Entity[]) {
        return _.groupBy(cases, (c: Entity) => c.atlasid);
    }

    getBiospecimensByAtlas(biospecimens: Entity[]) {
        return _.groupBy(biospecimens, (c: Entity) => c.atlasid);
    }

    getShouldShowFilteredFractions(
        selectedFiltersByAttrName: ISelectedFiltersByAttrName
    ) {
        return !_.isEmpty(selectedFiltersByAttrName);
    }

    getColumns(
        atlasMetaData: AtlasMetaData,
        shouldShowFilteredFractions: boolean,
        filteredCasesByAtlas: { [atlasId: string]: Entity[] },
        filteredBiospecimensByAtlas: { [atlasId: string]: Entity[] },
        assaysByAtlas: { [atlasId: string]: string[] },
        filteredAssaysByAtlas: { [atlasId: string]: string[] },
        filesByAtlas: { [atlasId: string]: Entity[] },
        filteredFilesByAtlas: { [atlasId: string]: Entity[] }
    ) {
        return [
            {
                name: 'Atlas Name',
                selector: (atlas: Atlas) => {
                    return atlas.htan_name
                        ?.replace('HTAN ', '')
                        ?.replace(' - ', ' ');
                },
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
                                <PublicationIcon
                                    publicationManifest={publicationManifest}
                                />
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
                    if (atlas.htan_id in (atlasMetaData || {})) {
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
                            shouldShowFilteredFractions,
                            filteredCasesByAtlas
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
                            shouldShowFilteredFractions,
                            filteredBiospecimensByAtlas
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
                            shouldShowFilteredFractions,
                            filteredAssaysByAtlas
                        )}
                        {(assaysByAtlas[atlas.htan_id] || []).length}
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
                            shouldShowFilteredFractions,
                            filteredFilesByAtlas
                        )}
                        {(filesByAtlas[atlas.htan_id] || []).length}
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
                cell: (atlas: AtlasTableData) => (
                    <ViewerCount
                        atlas={atlas}
                        fileViewerName={FileViewerName.autoMinerva}
                        tooltipContent="Autominerva: explore autogenerated views for imaging data"
                    />
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
                cell: (atlas: AtlasTableData) => (
                    <ViewerCount
                        atlas={atlas}
                        fileViewerName={FileViewerName.customMinerva}
                        tooltipContent="Minerva Story"
                        hrefOverride={{
                            'HTAN OHSU':
                                'https://minerva-story-htan-ohsu-demo.surge.sh/',
                        }}
                    />
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
                cell: (atlas: AtlasTableData) => (
                    <ViewerCount
                        atlas={atlas}
                        fileViewerName={FileViewerName.cellxgene}
                        tooltipContent="CellxGene: explore single cell data"
                        hrefOverride={{
                            'HTAN Vanderbilt':
                                'https://cellxgene.cziscience.com/collections/a48f5033-3438-4550-8574-cdff3263fdfd',
                            'HTAN BU':
                                'https://cellxgene.cziscience.com/d/BFAA0C46-7E34-4FA9-B08C-6DC6013B735A.cxg/',
                        }}
                    />
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
                cell: (atlas: AtlasTableData) => (
                    <ViewerCount
                        atlas={atlas}
                        fileViewerName={FileViewerName.isbcgc}
                        tooltipContent="ISB-CGC BigQuery: explore single cell data in Google BigQuery"
                    />
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
                cell: (atlas: AtlasTableData) => (
                    <ViewerCount
                        atlas={atlas}
                        fileViewerName={FileViewerName.ucscXena}
                        tooltipContent="UCSC Xena: explore single cell and imaging data"
                        hrefOverride={{
                            'HTAN HMS':
                                'https://beta.xenabrowser.net/singlecell/?hub=https://previewsinglecell.xenahubs.net:443&defaultTable=htan',
                            'HTAN MSK':
                                'https://beta.xenabrowser.net/singlecell/?hub=https://previewsinglecell.xenahubs.net:443&defaultTable=htan&study=msk_sclc_chan_2021',
                        }}
                    />
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
                cell: (atlas: AtlasTableData) => (
                    <>
                        <Tooltip overlay="cBioPortal: explore multimodal cancer data">
                            <span className="ml-auto">
                                {atlas.htan_name === 'HTAN OHSU' && (
                                    <a
                                        href="https://www.cbioportal.org/patient?studyId=brca_hta9_htan_2022&caseId=HTA9_1"
                                        target="_blank"
                                    >
                                        1
                                    </a>
                                )}
                                {atlas.htan_name === 'HTAN Vanderbilt' && (
                                    <a
                                        href="https://www.cbioportal.org/study/summary?id=crc_hta11_htan_2021"
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
        // Calculate all derived data in render
        const filesByAtlas = this.getFilesByAtlas(this.props.files);
        const assaysByAtlas = this.getAssaysByAtlas(filesByAtlas);
        const filteredFilesByAtlas = this.getFilesByAtlas(
            this.props.filteredFiles
        );
        const filteredAssaysByAtlas = this.getAssaysByAtlas(
            filteredFilesByAtlas
        );
        const filteredCasesByAtlas = this.getCasesByAtlas(
            this.props.filteredCases
        );
        const filteredBiospecimensByAtlas = this.getBiospecimensByAtlas(
            this.props.filteredBiospecimens
        );
        const shouldShowFilteredFractions = this.getShouldShowFilteredFractions(
            this.props.selectedFiltersByAttrName
        );
        const data = this.getData(
            this.props.filteredAtlases,
            filteredFilesByAtlas
        );
        const columns = this.getColumns(
            this.atlasMetaData,
            shouldShowFilteredFractions,
            filteredCasesByAtlas,
            filteredBiospecimensByAtlas,
            assaysByAtlas,
            filteredAssaysByAtlas,
            filesByAtlas,
            filteredFilesByAtlas
        );

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
                    columns={columns}
                    defaultSortField={'AtlasMeta.lead_institutions'}
                    data={data}
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
                    cloudBaseUrl={this.props.cloudBaseUrl}
                />
            </>
        );
    }
}

export default AtlasTable;
