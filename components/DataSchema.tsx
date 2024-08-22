import React, { useEffect, useMemo, useState } from 'react';
import { observer } from 'mobx-react';
import { IDataTableColumn } from 'react-data-table-component';
import _ from 'lodash';
import Tooltip from 'rc-tooltip';
import { useRouter } from 'next/router';

import {
    DataSchemaData,
    getDataSchemaValidValues,
    getDataType,
    getDataSchema,
    SchemaDataId,
    findConditionalIfAttributes,
} from '@htan/data-portal-schema';
import { getDataSchemaDataTableStyle } from '../lib/dataTableHelpers';
import Link from 'next/link';
import {
    EnhancedDataTable,
    IEnhancedDataTableColumn,
} from '@htan/data-portal-table';
import TruncatedValuesList from './TruncatedValuesList';
import 'bootstrap/dist/css/bootstrap.min.css';
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import { makeAutoObservable, runInAction } from 'mobx';

export interface IDataSchemaProps {
    schemaData: DataSchemaData[];
    dataSchemaMap: { [id: string]: DataSchemaData };
    allAttributes?: (DataSchemaData & { manifestName: string[] })[];
}

interface ManifestTabProps {
    schemaData: DataSchemaData;
    requiredDependencies: DataSchemaData[];
    schemaDataById: { [id: string]: DataSchemaData };
    onAttributeClick: (attribute: string) => void;
}

interface AttributeTabProps {
    attributeName: string;
    relatedAttributes: DataSchemaData[];
    dataSchemaMap: { [id: string]: DataSchemaData };
}

const LABEL_OVERRIDES: { [text: string]: string } = {
    BulkWESLevel1: 'BulkDNALevel1',
    BulkWESLevel2: 'BulkDNALevel2',
    BulkWESLevel3: 'BulkDNALevel3',
    ImagingLevel3Segmentation: 'ImagingLevel3',
};

const ATTRIBUTE_OVERRIDES: { [text: string]: string } = {
    'Bulk WES Level 1': 'Bulk DNA Level 1',
    'Bulk WES Level 2': 'Bulk DNA Level 2',
    'Bulk WES Level 3': 'Bulk DNA Level 3',
    'Imaging Level 3 Segmentation': 'Imaging Level 3',
};

enum ColumnName {
    Manifest = 'Manifest',
    Attribute = 'Attribute',
    Label = 'Label',
    Description = 'Description',
    Required = 'Required',
    ConditionalIf = 'Conditional If',
    DataType = 'Data Type',
    ValidValues = 'Valid Values',
    ManifestName = 'Manifest Name',
}

enum ColumnSelector {
    Manifest = 'attribute',
    Label = 'label',
    Description = 'description',
    Required = 'required',
    ConditionalIf = 'conditionalIf',
    DataType = 'dataType',
    ValidValues = 'validValues',
}

class DataSchemaStore {
    schemaData: DataSchemaData[] = [];
    dataSchemaMap: { [id: string]: DataSchemaData } = {};
    manifestData: { [key: string]: any } = {};
    activeTab: string = 'manifest';
    openTabs: string[] = [];
    currentUrl: string = '';

    constructor() {
        makeAutoObservable(this);
    }

    setSchemaData(data: DataSchemaData[]) {
        this.schemaData = data;
    }

    setDataSchemaMap(map: { [id: string]: DataSchemaData }) {
        this.dataSchemaMap = map;
    }

    setManifestData(data: { [key: string]: any }) {
        this.manifestData = data;
    }

    setActiveTab(tab: string) {
        this.activeTab = tab;
    }

    setOpenTabs(tabs: string[]) {
        this.openTabs = tabs;
    }

    setCurrentUrl(url: string) {
        this.currentUrl = url;
    }

    async fetchManifestData() {
        const preFetchedData = await preFetchManifestData(this.schemaData);
        runInAction(() => {
            this.setManifestData(preFetchedData);
        });
    }

    openNewTab(manifestName: string) {
        if (!this.openTabs.includes(manifestName)) {
            this.setOpenTabs([...this.openTabs, manifestName]);
        }
        this.setActiveTab(manifestName);
    }

    closeTab(manifestName: string) {
        this.setOpenTabs(this.openTabs.filter((tab) => tab !== manifestName));
        this.setActiveTab('manifest');
    }

    async fetchRelatedAttributes(
        attributeName: string
    ): Promise<DataSchemaData[]> {
        const targetSchema = Object.values(this.dataSchemaMap).find(
            (schema) => schema.attribute === attributeName
        );
        if (targetSchema && targetSchema.exclusiveConditionalDependencies) {
            const relatedAttributes = targetSchema.exclusiveConditionalDependencies
                .map((dependencyAttribute) => {
                    const dependencySchema = Object.values(
                        this.dataSchemaMap
                    ).find((schema) => schema.id === dependencyAttribute);
                    if (
                        dependencySchema &&
                        dependencySchema.parentIds.some((parentId) =>
                            targetSchema.parentIds.includes(parentId)
                        )
                    ) {
                        return dependencySchema;
                    }
                    return null;
                })
                .filter((schema): schema is DataSchemaData => schema !== null);
            return relatedAttributes;
        }
        return [];
    }

    hasRelatedAttributes(attributeName: string): boolean {
        const targetSchema = Object.values(this.dataSchemaMap).find(
            (schema) => schema.attribute === attributeName
        );
        return !!(
            targetSchema &&
            targetSchema.exclusiveConditionalDependencies &&
            targetSchema.exclusiveConditionalDependencies.length > 0
        );
    }
}

function filterOutComponentAttribute(data: DataSchemaData[]): DataSchemaData[] {
    return data.filter((item) => item.attribute !== 'Component');
}

const dataSchemaStore = new DataSchemaStore();

function getColumnDef(
    conditionalAttributes: { [key: string]: string[] },
    searchValues: { [key: string]: string },
    dataSchemaMap?: { [id: string]: DataSchemaData },
    isAttributeView: boolean = false,
    currentUrl: string = '',
    isManifestTab: boolean = false,
    onManifestClick?: (manifestName: string) => void,
    onAttributeClick?: (attributeName: string) => void
): { [name in ColumnName]: IDataTableColumn } {
    const columnDef: {
        [name in ColumnName]: IEnhancedDataTableColumn<DataSchemaData>;
    } = {
        [ColumnName.Manifest]: {
            name: (
                <Tooltip
                    overlay={`This is the ${
                        isAttributeView ? 'attribute' : 'manifest'
                    } column`}
                    placement="top"
                >
                    <span>
                        {isAttributeView || isManifestTab
                            ? ColumnName.Attribute
                            : ColumnName.Manifest}
                    </span>
                </Tooltip>
            ),
            selector: ColumnSelector.Manifest,
            cell: (schemaData) => {
                const hasRelatedAttributes = isManifestTab
                    ? dataSchemaStore.hasRelatedAttributes(schemaData.attribute)
                    : false;
                const isClickable = isManifestTab
                    ? !!onAttributeClick && hasRelatedAttributes
                    : !!onManifestClick;

                const style = isClickable
                    ? {
                          cursor: 'pointer',
                          color: 'blue',
                          textDecoration: 'underline',
                      }
                    : {
                          cursor: 'default',
                          color: 'black',
                          textDecoration: 'none',
                      };

                return (
                    <a
                        href="#"
                        onClick={(e) => {
                            if (isClickable) {
                                e.preventDefault();
                                if (isManifestTab && onAttributeClick) {
                                    onAttributeClick(schemaData.attribute);
                                } else if (onManifestClick) {
                                    onManifestClick(schemaData.label);
                                }
                            }
                        }}
                        style={style}
                    >
                        {ATTRIBUTE_OVERRIDES[schemaData.attribute] ||
                            schemaData.attribute}
                    </a>
                );
            },
            wrap: true,
            sortable: true,
        },
        [ColumnName.Attribute]: {
            name: (
                <Tooltip
                    overlay={`This is the ${
                        isAttributeView ? 'attribute' : 'manifest'
                    } column`}
                    placement="top"
                >
                    <span>
                        {isAttributeView
                            ? ColumnName.Attribute
                            : ColumnName.Manifest}
                    </span>
                </Tooltip>
            ),
            selector: ColumnSelector.Manifest,
            cell: (schemaData: DataSchemaData) => (
                <Link
                    href={
                        isAttributeView
                            ? '#'
                            : `/standard/${schemaData.label}?view=attribute`
                    }
                >
                    <a>
                        {ATTRIBUTE_OVERRIDES[schemaData.attribute] ||
                            schemaData.attribute}
                    </a>
                </Link>
            ),
            wrap: true,
            sortable: true,
        },
        [ColumnName.Label]: {
            name: (
                <Tooltip overlay="This is the label column" placement="top">
                    <span>{ColumnName.Label}</span>
                </Tooltip>
            ),
            selector: ColumnSelector.Label,
            format: (schemaData: DataSchemaData) =>
                LABEL_OVERRIDES[schemaData.label] || schemaData.label,
            wrap: true,
            sortable: true,
        },
        [ColumnName.Description]: {
            name: (
                <Tooltip
                    overlay="This is the description column"
                    placement="top"
                >
                    <span>{ColumnName.Description}</span>
                </Tooltip>
            ),
            selector: ColumnSelector.Description,
            grow: 2,
            wrap: true,
            sortable: true,
        },
        [ColumnName.Required]: {
            name: (
                <Tooltip overlay="This is the required column" placement="top">
                    <span>{ColumnName.Required}</span>
                </Tooltip>
            ),
            selector: ColumnSelector.Required,
            wrap: true,
            sortable: true,
            format: (schemaData: DataSchemaData) =>
                schemaData.required ? 'True' : 'False',
        },
        [ColumnName.ManifestName]: {
            name: (
                <Tooltip
                    overlay="This shows all manifests containing this attribute"
                    placement="top"
                >
                    <span>{ColumnName.ManifestName}</span>
                </Tooltip>
            ),
            selector: 'manifestNames',
            cell: (row: DataSchemaData) => {
                const extendedRow = row as DataSchemaData & {
                    manifestNames: string[];
                };
                return (
                    <TruncatedValuesList
                        attribute={extendedRow.attribute}
                        attributes={extendedRow.manifestNames}
                        modalTitle="Manifests"
                        countLabel="Number of manifests"
                    />
                );
            },
            wrap: true,
            sortable: true,
            minWidth: '250px',
        },
        [ColumnName.ConditionalIf]: {
            name: (
                <Tooltip
                    overlay="This attribute becomes mandatory if you have submitted data for any attributes listed within the column"
                    placement="top"
                >
                    <span>{ColumnName.ConditionalIf}</span>
                </Tooltip>
            ),
            selector: ColumnSelector.ConditionalIf,
            cell: (schemaData: DataSchemaData) => (
                <TruncatedValuesList
                    attribute={schemaData.attribute}
                    attributes={
                        conditionalAttributes[schemaData.attribute] || []
                    }
                    modalTitle="Conditional Attributes"
                    countLabel="Number of conditional attributes"
                />
            ),
            wrap: true,
            minWidth: '250px',
            sortable: true,
            getSearchValue: (schemaData: DataSchemaData) =>
                searchValues[schemaData.attribute] || '',
        },
        [ColumnName.DataType]: {
            name: (
                <Tooltip overlay="This is the data type column" placement="top">
                    <span>{ColumnName.DataType}</span>
                </Tooltip>
            ),
            selector: ColumnSelector.DataType,
            wrap: true,
            sortable: true,
            format: (schemaData: DataSchemaData) => getDataType(schemaData),
        },
        [ColumnName.ValidValues]: {
            name: (
                <Tooltip
                    overlay="This is the valid values column"
                    placement="top"
                >
                    <span>{ColumnName.ValidValues}</span>
                </Tooltip>
            ),
            selector: ColumnSelector.ValidValues,
            cell: (schemaData: DataSchemaData) => {
                const attributes = getDataSchemaValidValues(
                    schemaData,
                    dataSchemaMap
                ).map((s) => s.attribute);
                return (
                    <TruncatedValuesList
                        attribute={schemaData.attribute}
                        attributes={attributes}
                        modalTitle="valid values"
                        countLabel="Number of valid options"
                    />
                );
            },
            wrap: true,
            minWidth: '300px',
            sortable: true,
            getSearchValue: (schemaData: DataSchemaData) => {
                const attributes = getDataSchemaValidValues(
                    schemaData,
                    dataSchemaMap
                ).map((s) => s.attribute);
                return attributes.join(' ');
            },
        },
    };

    return columnDef;
}

const DataSchemaTable: React.FunctionComponent<{
    schemaData: DataSchemaData[];
    dataSchemaMap?: { [id: string]: DataSchemaData };
    title?: string;
    columns?: ColumnName[];
    isAttributeView?: boolean;
    isManifestTab?: boolean;
    onManifestClick?: (manifestName: string) => void;
    onAttributeClick?: (attributeName: string) => void;
}> = observer((props) => {
    const { isAttributeView = false, isManifestTab = false } = props;
    const [currentUrl, setCurrentUrl] = useState('');

    const [conditionalAttributes, setConditionalAttributes] = useState<{
        [key: string]: string[];
    }>({});
    const [searchValues, setSearchValues] = useState<{ [key: string]: string }>(
        {}
    );

    useEffect(() => {
        const fetchAttributes = async () => {
            const results: { [key: string]: string[] } = {};
            const searches: { [key: string]: string } = {};

            for (const schema of props.schemaData) {
                try {
                    const attrs = await findConditionalIfAttributes(
                        schema,
                        props.dataSchemaMap
                    );
                    results[schema.attribute] = attrs;
                    searches[schema.attribute] = attrs.join(' ');
                } catch (error) {
                    console.error(error);
                }
            }

            setConditionalAttributes(results);
            setSearchValues(searches);
        };

        fetchAttributes();
    }, [props.schemaData, props.dataSchemaMap]);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            setCurrentUrl(window.location.href);
        }
    }, []);

    const availableColumns = props.columns || [
        isAttributeView ? ColumnName.Attribute : ColumnName.Manifest,
        ColumnName.Description,
        ColumnName.Required,
        ColumnName.ConditionalIf,
        ColumnName.DataType,
        ColumnName.ValidValues,
    ];

    const columnDef = getColumnDef(
        conditionalAttributes,
        searchValues,
        props.dataSchemaMap,
        isAttributeView,
        currentUrl,
        isManifestTab,
        props.onManifestClick,
        props.onAttributeClick
    );
    const columns: IDataTableColumn[] = _.uniq(availableColumns).map((name) => {
        if (name === ColumnName.Manifest || name === ColumnName.Attribute) {
            return columnDef[
                isAttributeView ? ColumnName.Attribute : ColumnName.Manifest
            ];
        }
        return columnDef[name];
    });

    return (
        <EnhancedDataTable
            columns={columns}
            data={props.schemaData}
            striped={true}
            dense={false}
            pagination={true}
            paginationPerPage={50}
            noHeader={!props.title}
            title={props.title ? <strong>{props.title}</strong> : undefined}
            customStyles={getDataSchemaDataTableStyle()}
            downloadButtonLabel="Download Data Summary"
            hideColumnSelect={false}
        />
    );
});

export const preFetchManifestData = async (schemaData: DataSchemaData[]) => {
    schemaData = filterOutComponentAttribute(schemaData);
    const manifestPromises = schemaData.map(async (schema) => {
        const fullId = `bts:${schema.label}` as SchemaDataId;
        const { schemaDataById } = await getDataSchema([fullId]);
        const schemaData = schemaDataById[fullId];

        const requiredDependencies = (
            schemaData.requiredDependencies || []
        ).map((depId: string | { '@id': string }) => {
            const depSchemaId =
                typeof depId === 'string' ? depId : depId['@id'];
            return schemaDataById[depSchemaId];
        });

        return {
            [schema.label]: {
                schemaData,
                requiredDependencies,
                schemaDataById,
                manifestNames: requiredDependencies.map((dep) => dep.label),
            },
        };
    });

    const manifestDataArray = await Promise.all(manifestPromises);
    return Object.assign({}, ...manifestDataArray);
};

const DataSchema: React.FunctionComponent<IDataSchemaProps> = observer(
    (props) => {
        const router = useRouter();
        const [activeTab, setActiveTab] = useState('manifest');
        const [openTabs, setOpenTabs] = useState<string[]>([]);
        const [manifestData, setManifestData] = useState<{
            [key: string]: any;
        }>({});
        const isAttributeView = router.query.view === 'attribute';
        const [openAttributeTabs, setOpenAttributeTabs] = useState<string[]>(
            []
        );
        const [attributeData, setAttributeData] = useState<{
            [key: string]: DataSchemaData[];
        }>({});

        useEffect(() => {
            dataSchemaStore.setDataSchemaMap(props.dataSchemaMap);
        }, [props.dataSchemaMap]);

        const fetchRelatedAttributes = async (attributeName: string) => {
            return await dataSchemaStore.fetchRelatedAttributes(attributeName);
        };

        useEffect(() => {
            const fetchData = async () => {
                const preFetchedData = await preFetchManifestData(
                    props.schemaData
                );
                setManifestData(preFetchedData);
            };

            fetchData();
        }, [props.schemaData, props.dataSchemaMap]);

        const handleTabChange = (tab: string) => {
            setActiveTab(tab);
        };

        const openNewTab = (manifestName: string) => {
            if (!openTabs.includes(manifestName)) {
                setOpenTabs((prevTabs) => [...prevTabs, manifestName]);
            }
            setActiveTab(manifestName);
        };

        const closeTab = (manifestName: string) => {
            setOpenTabs(openTabs.filter((tab) => tab !== manifestName));
            setActiveTab('manifest');
        };
        const openNewAttributeTab = async (attributeName: string) => {
            if (!openAttributeTabs.includes(attributeName)) {
                setOpenAttributeTabs((prevTabs) => [
                    ...prevTabs,
                    attributeName,
                ]);
                const relatedAttributes = await fetchRelatedAttributes(
                    attributeName
                );

                setAttributeData((prevData) => ({
                    ...prevData,
                    [attributeName]: relatedAttributes || [],
                }));
            }
            setActiveTab(attributeName);
        };

        const closeAttributeTab = (attributeName: string) => {
            setOpenAttributeTabs(
                openAttributeTabs.filter((tab) => tab !== attributeName)
            );
            setActiveTab('manifest');
        };

        const manifestColumns = [ColumnName.Manifest, ColumnName.Description];
        const allAttributes = props.allAttributes || [];

        const allAttributesColumns = [
            ColumnName.Attribute,
            ColumnName.ManifestName,
            ColumnName.Description,
            ColumnName.Required,
            ColumnName.ConditionalIf,
            ColumnName.DataType,
            ColumnName.ValidValues,
        ];
        return (
            <div>
                <ul className="nav nav-tabs">
                    <li className="nav-item">
                        <a
                            className={`nav-link ${
                                activeTab === 'manifest' ? 'active' : ''
                            }`}
                            onClick={() => handleTabChange('manifest')}
                            role="tab"
                        >
                            Manifest
                        </a>
                    </li>
                    <li className="nav-item">
                        <a
                            className={`nav-link ${
                                activeTab === 'attributes' ? 'active' : ''
                            }`}
                            onClick={() => handleTabChange('attributes')}
                            role="tab"
                        >
                            All Attributes
                        </a>
                    </li>
                    {openTabs.map((tab) => (
                        <li className="nav-item" key={tab}>
                            <a
                                className={`nav-link ${
                                    activeTab === tab ? 'active' : ''
                                }`}
                                onClick={() => handleTabChange(tab)}
                                role="tab"
                            >
                                {tab}
                                <button
                                    className="close ml-2"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        closeTab(tab);
                                    }}
                                >
                                    &times;
                                </button>
                            </a>
                        </li>
                    ))}
                    {openAttributeTabs.map((tab) => (
                        <li className="nav-item" key={tab}>
                            <a
                                className={`nav-link ${
                                    activeTab === tab ? 'active' : ''
                                }`}
                                onClick={() => handleTabChange(tab)}
                                role="tab"
                            >
                                {tab}
                                <button
                                    className="close ml-2"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        closeAttributeTab(tab);
                                    }}
                                >
                                    &times;
                                </button>
                            </a>
                        </li>
                    ))}
                </ul>
                <div className="tab-content mt-3">
                    <div
                        className={`tab-pane fade ${
                            activeTab === 'manifest' ? 'show active' : ''
                        }`}
                        role="tabpanel"
                    >
                        <DataSchemaTable
                            schemaData={filterOutComponentAttribute(
                                props.schemaData
                            )}
                            dataSchemaMap={props.dataSchemaMap}
                            title="Data Schema:"
                            isAttributeView={isAttributeView}
                            columns={manifestColumns}
                            onManifestClick={openNewTab}
                        />
                    </div>
                    <div
                        className={`tab-pane fade ${
                            activeTab === 'attributes' ? 'show active' : ''
                        }`}
                        role="tabpanel"
                    >
                        <DataSchemaTable
                            schemaData={filterOutComponentAttribute(
                                allAttributes
                            )}
                            dataSchemaMap={props.dataSchemaMap}
                            title="All Attributes:"
                            isAttributeView={true}
                            columns={allAttributesColumns}
                        />
                    </div>
                    {openTabs.map((tab) => (
                        <div
                            key={tab}
                            className={`tab-pane fade ${
                                activeTab === tab ? 'show active' : ''
                            }`}
                            role="tabpanel"
                        >
                            {manifestData[tab] && (
                                <ManifestTab
                                    schemaData={manifestData[tab].schemaData}
                                    requiredDependencies={
                                        manifestData[tab].requiredDependencies
                                    }
                                    schemaDataById={
                                        manifestData[tab].schemaDataById
                                    }
                                    onAttributeClick={openNewAttributeTab}
                                />
                            )}
                        </div>
                    ))}
                    {openAttributeTabs.map((tab) => (
                        <div
                            key={tab}
                            className={`tab-pane fade ${
                                activeTab === tab ? 'show active' : ''
                            }`}
                            role="tabpanel"
                        >
                            <AttributeTab
                                attributeName={tab}
                                relatedAttributes={attributeData[tab] || []}
                                dataSchemaMap={props.dataSchemaMap}
                            />
                        </div>
                    ))}
                </div>
            </div>
        );
    }
);

const ManifestTab: React.FC<ManifestTabProps> = ({
    schemaData,
    requiredDependencies,
    schemaDataById,
    onAttributeClick,
}) => {
    return (
        <Container>
            <Row>
                <Col>
                    <h1>{schemaData.attribute} Manifest</h1>
                </Col>
            </Row>
            <Row>
                <Col>
                    <DataSchemaTable
                        schemaData={filterOutComponentAttribute(
                            requiredDependencies
                        )}
                        dataSchemaMap={schemaDataById}
                        isManifestTab={true}
                        onAttributeClick={onAttributeClick}
                    />
                </Col>
            </Row>
        </Container>
    );
};

const AttributeTab: React.FC<AttributeTabProps> = ({
    attributeName,
    relatedAttributes,
    dataSchemaMap,
}) => {
    return (
        <Container>
            <Row>
                <Col>
                    <h1>{attributeName} Attribute</h1>
                </Col>
            </Row>
            <Row>
                <Col>
                    <DataSchemaTable
                        schemaData={relatedAttributes}
                        dataSchemaMap={dataSchemaMap}
                        isAttributeView={true}
                    />
                </Col>
            </Row>
        </Container>
    );
};

export default DataSchema;
