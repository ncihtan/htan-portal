import _ from 'lodash';
import Tooltip from 'rc-tooltip';
import React, { useEffect, useRef, useState } from 'react';
import { IDataTableColumn } from 'react-data-table-component';

import {
    ATTRIBUTE_OVERRIDES,
    DataSchemaData,
    DataSchemaDataWithManifest,
    getDataSchemaValidValues,
    getDataType,
    getManifestAttributes,
    LABEL_OVERRIDES,
    SchemaDataById,
} from '@htan/data-portal-schema';
import {
    EnhancedDataTable,
    IEnhancedDataTableColumn,
} from '@htan/data-portal-table';
import { getDataSchemaDataTableStyle } from '../lib/dataTableHelpers';
import TruncatedValuesList from './TruncatedValuesList';

export interface IDataSchemaProps {
    schemaData: DataSchemaData[];
    dataSchemaMap: SchemaDataById;
    allAttributes?: DataSchemaDataWithManifest[];
    manifestId?: string;
}

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
    ConditionalIf = 'conditionalIfValues',
    DataType = 'dataType',
    ValidValues = 'validValues',
    ManifestName = 'manifestNames',
}

const MANIFEST_TAB_ID = '_manifest_';
const ALL_ATTRIBUTES_TAB_ID = '_attributes_';

function getColumnDef(
    dataSchemaMap?: SchemaDataById,
    isAttributeView: boolean = false,
    onManifestClick?: (schemaData: DataSchemaData) => void
): { [name in ColumnName]: IDataTableColumn } {
    const attributeColumn = {
        name: isAttributeView ? ColumnName.Attribute : ColumnName.Manifest,
        selector: ColumnSelector.Manifest,
        cell: (schemaData: DataSchemaData) => {
            const attribute =
                ATTRIBUTE_OVERRIDES[schemaData.attribute] ||
                schemaData.attribute;

            return onManifestClick ? (
                <a
                    href="#"
                    onClick={(e) => {
                        e.preventDefault();
                        onManifestClick(schemaData);
                    }}
                    style={{
                        cursor: 'pointer',
                        color: 'blue',
                        textDecoration: 'underline',
                    }}
                >
                    {attribute}
                </a>
            ) : (
                attribute
            );
        },
        grow: 1.5,
        wrap: true,
        sortable: true,
    };

    return {
        [ColumnName.Manifest]: attributeColumn,
        [ColumnName.Attribute]: attributeColumn,
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
            selector: ColumnSelector.ManifestName,
            format: (row: DataSchemaData) =>
                (row as DataSchemaDataWithManifest).manifestNames.join(','),
            cell: (row: DataSchemaData) => {
                const extendedRow = row as DataSchemaDataWithManifest;
                return (
                    <TruncatedValuesList
                        attribute={extendedRow.attribute}
                        attributes={extendedRow.manifestNames}
                        modalTitle="Manifests"
                        countLabel="Number of manifests"
                    />
                );
            },
            grow: 2,
            wrap: true,
            sortable: true,
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
            grow: 2,
            wrap: true,
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
                        formatValue={(value) => value.toLowerCase()}
                    />
                );
            },
            grow: 2.5,
            wrap: true,
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

function getInitialManifestIds(props: IDataSchemaProps) {
    const knowIdsMap = _(props.schemaData)
        .map((d) => d.id)
        .keyBy((id) => id.toLowerCase())
        .value();
    const key = props.manifestId
        ? `bts:${props.manifestId.toLowerCase()}`
        : undefined;
    const schemaId = key ? knowIdsMap[key] : undefined;

    return schemaId ? [schemaId] : [];
}

function getInitialManifestId(props: IDataSchemaProps) {
    const initialIds = getInitialManifestIds(props);

    return _.isEmpty(initialIds) ? MANIFEST_TAB_ID : initialIds[0];
}

const DataSchemaTable: React.FunctionComponent<{
    schemaData: DataSchemaData[];
    dataSchemaMap?: { [id: string]: DataSchemaData };
    title?: string;
    columns?: ColumnName[];
    isAttributeView?: boolean;
    onManifestClick?: (schemaData: DataSchemaData) => void;
}> = (props) => {
    const { isAttributeView = false } = props;

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
        props.onManifestClick
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
};

const DataSchema: React.FunctionComponent<IDataSchemaProps> = (props) => {
    const [activeTab, setActiveTab] = useState(getInitialManifestId(props));
    const [openManifestTabs, setOpenManifestTabs] = useState<string[]>(
        getInitialManifestIds(props)
    );

    const componentRef = useRef<null | HTMLDivElement>(null);
    useEffect(() => {
        // scroll to this component if the initially active tab is not the default one
        if (
            componentRef.current &&
            getInitialManifestId(props) != MANIFEST_TAB_ID
        ) {
            componentRef.current.scrollIntoView();
        }
    }, []);

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
        const openTabs = openManifestTabs.filter(
            (tabId) => tabId !== manifestId
        );
        setOpenManifestTabs(openTabs);
        setActiveTab(_.last(openTabs) || MANIFEST_TAB_ID);
    };

    return (
        <div ref={componentRef}>
            <ul className="nav nav-tabs">
                <li className="nav-item">
                    <a
                        className={`nav-link ${
                            activeTab === MANIFEST_TAB_ID ? 'active' : ''
                        }`}
                        onClick={() => handleTabChange(MANIFEST_TAB_ID)}
                        role="tab"
                    >
                        Manifests
                    </a>
                </li>
                <li className="nav-item">
                    <a
                        className={`nav-link ${
                            activeTab === ALL_ATTRIBUTES_TAB_ID ? 'active' : ''
                        }`}
                        onClick={() => handleTabChange(ALL_ATTRIBUTES_TAB_ID)}
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
            </ul>
            <div className="tab-content mt-3">
                <div
                    className={`tab-pane fade ${
                        activeTab === MANIFEST_TAB_ID ? 'show active' : ''
                    }`}
                    role="tabpanel"
                >
                    <DataSchemaTable
                        schemaData={props.schemaData}
                        dataSchemaMap={props.dataSchemaMap}
                        isAttributeView={false}
                        columns={[ColumnName.Manifest, ColumnName.Description]}
                        onManifestClick={openNewManifestTab}
                    />
                </div>
                <div
                    className={`tab-pane fade ${
                        activeTab === ALL_ATTRIBUTES_TAB_ID ? 'show active' : ''
                    }`}
                    role="tabpanel"
                >
                    <DataSchemaTable
                        schemaData={props.allAttributes || []}
                        dataSchemaMap={props.dataSchemaMap}
                        isAttributeView={true}
                        columns={[
                            ColumnName.Attribute,
                            ColumnName.ManifestName,
                            ColumnName.Description,
                            ColumnName.Required,
                            ColumnName.ConditionalIf,
                            ColumnName.DataType,
                            ColumnName.ValidValues,
                        ]}
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
                        <DataSchemaTable
                            schemaData={getManifestAttributes(
                                props.dataSchemaMap[manifestId],
                                props.allAttributes || []
                            )}
                            dataSchemaMap={props.dataSchemaMap}
                            isAttributeView={true}
                        />
                    </div>
                ))}
            </div>
        </div>
    );
};

export default DataSchema;
