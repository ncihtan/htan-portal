import React, { useState } from 'react';
import { observer } from 'mobx-react';
import { IDataTableColumn } from 'react-data-table-component';
import _ from 'lodash';
import Tooltip from 'rc-tooltip';

import {
    DataSchemaData,
    filterOutComponentAttribute,
    findRelatedAttributes,
    getDataSchemaValidValues,
    getDataType,
    hasRelatedAttributes,
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
    schemaData: DataSchemaData;
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

const MANIFEST_TAB_ID = '_manifest_';
const ALL_ATTRIBUTES_TAB_ID = '_attributes_';

function getColumnDef(
    dataSchemaMap?: SchemaDataById,
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
                const isClickable = isManifestTab
                    ? !!onAttributeClick &&
                      hasRelatedAttributes(schemaData, dataSchemaMap)
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

function getTabName(id: string, dataSchemaMap: SchemaDataById) {
    const attribute = dataSchemaMap[id]?.attribute;

    return ATTRIBUTE_OVERRIDES[attribute] || attribute;
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
            paginationRowsPerPageOptions={[10, 20, 50, 100, 500]}
            noHeader={!props.title}
            title={props.title ? <strong>{props.title}</strong> : undefined}
            customStyles={getDataSchemaDataTableStyle()}
            downloadButtonLabel="Download Data Summary"
            hideColumnSelect={false}
        />
    );
});

const DataSchema: React.FunctionComponent<IDataSchemaProps> = observer(
    (props) => {
        const [activeTab, setActiveTab] = useState(MANIFEST_TAB_ID);
        const [openManifestTabs, setOpenManifestTabs] = useState<string[]>([]);
        const [openAttributeTabs, setOpenAttributeTabs] = useState<string[]>(
            []
        );

        const handleTabChange = (tab: string) => {
            setActiveTab(tab);
        };

        const openNewManifestTab = (schemaData: DataSchemaData) => {
            const manifestId = schemaData.id;
            if (!openManifestTabs.includes(manifestId)) {
                setOpenManifestTabs((prevTabs) => [...prevTabs, manifestId]);
            }
            setActiveTab(manifestId);
        };

        const closeManifestTab = (manifestId: string) => {
            setOpenManifestTabs(
                openManifestTabs.filter((tabId) => tabId !== manifestId)
            );
            setActiveTab(MANIFEST_TAB_ID);
        };

        const openNewAttributeTab = (schemaData: DataSchemaData) => {
            const attributeId = schemaData.id;
            if (!openAttributeTabs.includes(attributeId)) {
                setOpenAttributeTabs((prevTabs) => [...prevTabs, attributeId]);
            }
            setActiveTab(attributeId);
        };

        const closeAttributeTab = (attributeId: string) => {
            setOpenAttributeTabs(
                openAttributeTabs.filter((tabId) => tabId !== attributeId)
            );
            setActiveTab(MANIFEST_TAB_ID);
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
                                activeTab === MANIFEST_TAB_ID ? 'active' : ''
                            }`}
                            onClick={() => handleTabChange(MANIFEST_TAB_ID)}
                            role="tab"
                        >
                            Manifest
                        </a>
                    </li>
                    <li className="nav-item">
                        <a
                            className={`nav-link ${
                                activeTab === ALL_ATTRIBUTES_TAB_ID
                                    ? 'active'
                                    : ''
                            }`}
                            onClick={() =>
                                handleTabChange(ALL_ATTRIBUTES_TAB_ID)
                            }
                            role="tab"
                        >
                            All Attributes
                        </a>
                    </li>
                    {openManifestTabs.map((manifestId) => (
                        <li className="nav-item" key={manifestId}>
                            <a
                                className={`nav-link ${
                                    activeTab === manifestId ? 'active' : ''
                                }`}
                                onClick={() => handleTabChange(manifestId)}
                                role="tab"
                            >
                                {getTabName(manifestId, props.dataSchemaMap)}
                                <button
                                    className="close ml-2"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        closeManifestTab(manifestId);
                                    }}
                                >
                                    &times;
                                </button>
                            </a>
                        </li>
                    ))}
                    {openAttributeTabs.map((attributeId) => (
                        <li className="nav-item" key={attributeId}>
                            <a
                                className={`nav-link ${
                                    activeTab === attributeId ? 'active' : ''
                                }`}
                                onClick={() => handleTabChange(attributeId)}
                                role="tab"
                            >
                                {getTabName(attributeId, props.dataSchemaMap)}
                                <button
                                    className="close ml-2"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        closeAttributeTab(attributeId);
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
                            activeTab === MANIFEST_TAB_ID ? 'show active' : ''
                        }`}
                        role="tabpanel"
                    >
                        <DataSchemaTable
                            schemaData={filterOutComponentAttribute(
                                props.schemaData
                            )}
                            dataSchemaMap={props.dataSchemaMap}
                            isAttributeView={false}
                            columns={manifestColumns}
                            onManifestClick={openNewManifestTab}
                        />
                    </div>
                    <div
                        className={`tab-pane fade ${
                            activeTab === ALL_ATTRIBUTES_TAB_ID
                                ? 'show active'
                                : ''
                        }`}
                        role="tabpanel"
                    >
                        <DataSchemaTable
                            schemaData={filterOutComponentAttribute(
                                allAttributes
                            )}
                            dataSchemaMap={props.dataSchemaMap}
                            isAttributeView={true}
                            columns={allAttributesColumns}
                        />
                    </div>
                    {openManifestTabs.map((manifestId) => (
                        <div
                            key={manifestId}
                            className={`tab-pane fade ${
                                activeTab === manifestId ? 'show active' : ''
                            }`}
                            role="tabpanel"
                        >
                            <ManifestTab
                                schemaData={props.dataSchemaMap[manifestId]}
                                requiredDependencies={(
                                    props.dataSchemaMap[manifestId]
                                        ?.requiredDependencies || []
                                ).map((id) => props.dataSchemaMap[id])}
                                schemaDataById={props.dataSchemaMap}
                                onAttributeClick={openNewAttributeTab}
                            />
                        </div>
                    ))}
                    {openAttributeTabs.map((attributeId) => (
                        <div
                            key={attributeId}
                            className={`tab-pane fade ${
                                activeTab === attributeId ? 'show active' : ''
                            }`}
                            role="tabpanel"
                        >
                            <AttributeTab
                                schemaData={props.dataSchemaMap[attributeId]}
                                relatedAttributes={findRelatedAttributes(
                                    props.dataSchemaMap[attributeId],
                                    props.dataSchemaMap
                                )}
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
    schemaData,
    relatedAttributes,
    dataSchemaMap,
}) => {
    return (
        <Container>
            <Row>
                <Col>
                    <h1>{schemaData.attribute} Attribute</h1>
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
