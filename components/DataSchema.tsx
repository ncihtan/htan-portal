import React, { useEffect, useState } from 'react';
import { observer } from 'mobx-react';
import { IDataTableColumn } from 'react-data-table-component';
import _ from 'lodash';
import Tooltip from 'rc-tooltip';

import {
    DataSchemaData,
    getDataSchemaValidValues,
    getDataType,
    SchemaDataId,
    SchemaDataById,
} from '@htan/data-portal-schema';
import { getDataSchemaDataTableStyle } from '../lib/dataTableHelpers';
import Link from 'next/link';
import {
    EnhancedDataTable,
    IEnhancedDataTableColumn,
} from '@htan/data-portal-table';
import TruncatedValuesList from './TruncatedValuesList';
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import { makeAutoObservable } from 'mobx';

export interface IDataSchemaProps {
    schemaData: DataSchemaData[];
    dataSchemaMap: SchemaDataById;
    allAttributes?: (DataSchemaData & { manifestName: string })[];
}

interface ManifestTabProps {
    schemaData: DataSchemaData;
    requiredDependencies: DataSchemaData[];
    schemaDataById: { [id: string]: DataSchemaData };
    onAttributeClick: (schemaData: DataSchemaData) => void;
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

    findRelatedAttributes(schemaData?: DataSchemaData): DataSchemaData[] {
        if (schemaData && schemaData.exclusiveConditionalDependencies) {
            return schemaData.exclusiveConditionalDependencies
                .map((dependencyAttribute) => {
                    const dependencySchema = Object.values(
                        this.dataSchemaMap
                    ).find((schema) => schema.id === dependencyAttribute);
                    if (
                        dependencySchema &&
                        dependencySchema.parentIds.some((parentId) =>
                            schemaData.parentIds.includes(parentId)
                        )
                    ) {
                        return dependencySchema;
                    }
                    return null;
                })
                .filter((schema): schema is DataSchemaData => schema !== null);
        }
        return [];
    }

    hasRelatedAttributes(schemaData?: DataSchemaData): boolean {
        if (schemaData && schemaData.exclusiveConditionalDependencies) {
            return schemaData.exclusiveConditionalDependencies.some(
                (dependencyAttribute) => {
                    const dependencySchema = Object.values(
                        this.dataSchemaMap
                    ).find((schema) => schema.id === dependencyAttribute);
                    return (
                        dependencySchema &&
                        dependencySchema.parentIds.some((parentId) =>
                            schemaData.parentIds.includes(parentId)
                        )
                    );
                }
            );
        }
        return false;
    }
}

function filterOutComponentAttribute(data: DataSchemaData[]): DataSchemaData[] {
    return data.filter((item) => item.attribute !== 'Component');
}

const dataSchemaStore = new DataSchemaStore();

function getColumnDef(
    dataSchemaMap?: { [id: string]: DataSchemaData },
    isAttributeView: boolean = false,
    isManifestTab: boolean = false,
    onManifestClick?: (schemaData: DataSchemaData) => void,
    onAttributeClick?: (schemaData: DataSchemaData) => void
): { [name in ColumnName]: IDataTableColumn } {
    return {
        [ColumnName.Manifest]: {
            name:
                isAttributeView || isManifestTab
                    ? ColumnName.Attribute
                    : ColumnName.Manifest,
            selector: ColumnSelector.Manifest,
            cell: (schemaData) => {
                const hasRelatedAttributes = isManifestTab
                    ? dataSchemaStore.hasRelatedAttributes(schemaData)
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
                                    onAttributeClick(schemaData);
                                } else if (onManifestClick) {
                                    onManifestClick(schemaData);
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
            name: isAttributeView ? ColumnName.Attribute : ColumnName.Manifest,
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
            name: ColumnName.Label,
            selector: ColumnSelector.Label,
            format: (schemaData: DataSchemaData) =>
                LABEL_OVERRIDES[schemaData.label] || schemaData.label,
            wrap: true,
            sortable: true,
        },
        [ColumnName.Description]: {
            name: ColumnName.Description,
            selector: ColumnSelector.Description,
            grow: 2,
            wrap: true,
            sortable: true,
        },
        [ColumnName.Required]: {
            name: ColumnName.Required,
            selector: ColumnSelector.Required,
            wrap: true,
            sortable: true,
            format: (schemaData: DataSchemaData) =>
                schemaData.required ? 'True' : 'False',
        },
        [ColumnName.ManifestName]: {
            name: (
                <Tooltip
                    overlay="All manifests containing this attribute"
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
                    attributes={schemaData.conditionalIfValues}
                    modalTitle="Conditional Attributes"
                    countLabel="Number of conditional attributes"
                />
            ),
            wrap: true,
            minWidth: '250px',
            sortable: true,
            getSearchValue: (schemaData: DataSchemaData) =>
                schemaData.conditionalIfValues.join(' '),
        },
        [ColumnName.DataType]: {
            name: ColumnName.DataType,
            selector: ColumnSelector.DataType,
            wrap: true,
            sortable: true,
            format: (schemaData: DataSchemaData) => getDataType(schemaData),
        },
        [ColumnName.ValidValues]: {
            name: ColumnName.ValidValues,
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
    } as { [name in ColumnName]: IEnhancedDataTableColumn<DataSchemaData> };
}

const DataSchemaTable: React.FunctionComponent<{
    schemaData: DataSchemaData[];
    dataSchemaMap?: { [id: string]: DataSchemaData };
    title?: string;
    columns?: ColumnName[];
    isAttributeView?: boolean;
    isManifestTab?: boolean;
    onManifestClick?: (schemaData: DataSchemaData) => void;
    onAttributeClick?: (schemaData: DataSchemaData) => void;
}> = observer((props) => {
    const { isAttributeView = false, isManifestTab = false } = props;

    const availableColumns = props.columns || [
        isAttributeView ? ColumnName.Attribute : ColumnName.Manifest,
        ColumnName.Description,
        ColumnName.Required,
        ColumnName.ConditionalIf,
        ColumnName.DataType,
        ColumnName.ValidValues,
    ];

    const columnDef = getColumnDef(
        props.dataSchemaMap,
        isAttributeView,
        isManifestTab,
        props.onManifestClick,
        props.onAttributeClick
    );

    const columns: IDataTableColumn[] = _.uniq(availableColumns).map(
        (name) => columnDef[name]
    );

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

export function preloadManifestData(
    schemaData: DataSchemaData[],
    schemaDataById: SchemaDataById
) {
    schemaData = filterOutComponentAttribute(schemaData);
    const manifestDataArray = schemaData.map((schema) => {
        const fullId = `bts:${schema.label}` as SchemaDataId;
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

    return Object.assign({}, ...manifestDataArray);
}

const DataSchema: React.FunctionComponent<IDataSchemaProps> = observer(
    (props) => {
        const manifestData = preloadManifestData(
            props.schemaData,
            props.dataSchemaMap
        );
        const [activeTab, setActiveTab] = useState('manifest');
        const [openTabs, setOpenTabs] = useState<string[]>([]);
        const [openAttributeTabs, setOpenAttributeTabs] = useState<string[]>(
            []
        );
        const [attributeData, setAttributeData] = useState<{
            [key: string]: DataSchemaData[];
        }>({});

        useEffect(() => {
            dataSchemaStore.setDataSchemaMap(props.dataSchemaMap);
            dataSchemaStore.setManifestData(manifestData);
        }, [props.dataSchemaMap]);

        const findRelatedAttributes = (schemaData: DataSchemaData) => {
            return dataSchemaStore.findRelatedAttributes(schemaData);
        };

        const handleTabChange = (tab: string) => {
            setActiveTab(tab);
        };

        const openNewTab = (schemaData: DataSchemaData) => {
            const manifestName = schemaData.label;
            if (!openTabs.includes(manifestName)) {
                setOpenTabs((prevTabs) => [...prevTabs, manifestName]);
            }
            setActiveTab(manifestName);
        };

        const closeTab = (manifestName: string) => {
            setOpenTabs(openTabs.filter((tab) => tab !== manifestName));
            setActiveTab('manifest');
        };

        const openNewAttributeTab = (schemaData: DataSchemaData) => {
            const attributeName = schemaData.attribute;
            if (!openAttributeTabs.includes(attributeName)) {
                setOpenAttributeTabs((prevTabs) => [
                    ...prevTabs,
                    attributeName,
                ]);
                const relatedAttributes = findRelatedAttributes(schemaData);

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
                            isAttributeView={false}
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
