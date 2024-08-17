import React, { useEffect, useMemo, useState } from 'react';
import { observer } from 'mobx-react';
import { IDataTableColumn } from 'react-data-table-component';
import _ from 'lodash';
import Tooltip from 'rc-tooltip';
import { useRouter } from 'next/router';
import { memoize } from 'lodash';

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
import { findConditionalAttributes } from '@htan/data-portal-schema';
import TruncatedValuesList from './TruncatedValuesList';
import 'bootstrap/dist/css/bootstrap.min.css';
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import { makeAutoObservable, runInAction } from 'mobx';

export interface IDataSchemaProps {
    schemaData: DataSchemaData[];
    dataSchemaMap: { [id: string]: DataSchemaData };
}

interface ManifestTabProps {
    schemaData: DataSchemaData;
    requiredDependencies: DataSchemaData[];
    schemaDataById: { [id: string]: DataSchemaData };
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
}

const dataSchemaStore = new DataSchemaStore();

function getColumnDef(
    dataSchemaMap?: { [id: string]: DataSchemaData },
    isAttributeView: boolean = false,
    currentUrl: string = '',
    onManifestClick?: (manifestName: string) => void
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
                        {isAttributeView
                            ? ColumnName.Attribute
                            : ColumnName.Manifest}
                    </span>
                </Tooltip>
            ),
            selector: ColumnSelector.Manifest,
            cell: (schemaData: DataSchemaData) => (
                <a
                    href="#"
                    onClick={(e) => {
                        e.preventDefault();
                        onManifestClick && onManifestClick(schemaData.label);
                    }}
                >
                    {ATTRIBUTE_OVERRIDES[schemaData.attribute] ||
                        schemaData.attribute}
                </a>
            ),
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
                    overlay="This is the manifest name column"
                    placement="top"
                >
                    <span>{ColumnName.ManifestName}</span>
                </Tooltip>
            ),
            selector: 'manifestName',
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
            cell: (schemaData: DataSchemaData) => {
                const [
                    conditionalAttributes,
                    setConditionalAttributes,
                ] = useState<string[]>([]);

                useEffect(() => {
                    findConditionalIfAttributes(schemaData, dataSchemaMap)
                        .then(setConditionalAttributes)
                        .catch(console.error);
                }, [schemaData, dataSchemaMap]);

                return (
                    <TruncatedValuesList
                        attribute={schemaData.attribute}
                        attributes={conditionalAttributes}
                        modalTitle="Conditional Attributes"
                        countLabel="Number of conditional attributes"
                    />
                );
            },
            wrap: true,
            minWidth: '250px',
            sortable: true,
            getSearchValue: (schemaData: DataSchemaData) => {
                const [searchValue, setSearchValue] = useState('');

                useEffect(() => {
                    findConditionalIfAttributes(schemaData, dataSchemaMap)
                        .then((attrs) => setSearchValue(attrs.join(' ')))
                        .catch(console.error);
                }, [schemaData, dataSchemaMap]);

                return searchValue;
            },
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
    onManifestClick?: (manifestName: string) => void;
}> = observer((props) => {
    const { isAttributeView = false } = props;
    const [currentUrl, setCurrentUrl] = useState('');

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
        props.dataSchemaMap,
        isAttributeView,
        currentUrl,
        props.onManifestClick
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
            pagination={false}
            noHeader={!props.title}
            title={props.title ? <strong>{props.title}</strong> : undefined}
            customStyles={getDataSchemaDataTableStyle()}
            downloadButtonLabel="Download Data Summary"
            hideColumnSelect={false}
        />
    );
});

const memoizedGetDataSchemaValidValues = memoize(getDataSchemaValidValues);
const memoizedFindConditionalAttributes = memoize(findConditionalAttributes);

// export function getAllAttributes(
//     schemaData: DataSchemaData[],
//     dataSchemaMap: { [id: string]: DataSchemaData }
// ): (DataSchemaData & { manifestName: string })[] {
//     const allAttributes = new Map<
//         string,
//         DataSchemaData & { manifestName: string }
//     >();
//     const queue: { attribute: DataSchemaData; manifestName: string }[] = [];

//     function queueAttribute(attribute: DataSchemaData, manifestName: string) {
//         if (!allAttributes.has(attribute.attribute)) {
//             queue.push({ attribute, manifestName });
//         }
//     }

//     schemaData.forEach((attr) => queueAttribute(attr, attr.label));

//     while (queue.length > 0) {
//         const { attribute, manifestName } = queue.shift()!;

//         if (!allAttributes.has(attribute.attribute)) {
//             const attributeWithManifest = { ...attribute, manifestName };
//             allAttributes.set(attribute.attribute, attributeWithManifest);

//             // Add required dependencies
//             attribute.requiredDependencies.forEach((depId) => {
//                 const dep = dataSchemaMap[depId];
//                 if (dep) queueAttribute(dep, manifestName);
//             });

//             // Add conditional dependencies
//             attribute.conditionalDependencies.forEach((depId) => {
//                 const dep = dataSchemaMap[depId];
//                 if (dep) queueAttribute(dep, manifestName);
//             });

//             // Add exclusive conditional dependencies
//             attribute.exclusiveConditionalDependencies.forEach((depId) => {
//                 const dep = dataSchemaMap[depId];
//                 if (dep) queueAttribute(dep, manifestName);
//             });

//             // Add dependencies from validValues
//             memoizedGetDataSchemaValidValues(
//                 attribute,
//                 dataSchemaMap
//             ).forEach((dep) => queueAttribute(dep, manifestName));

//             // Add conditional attributes
//             memoizedFindConditionalAttributes(attribute, dataSchemaMap).forEach(
//                 (condAttrId) => {
//                     const dep = dataSchemaMap[condAttrId];
//                     if (dep) queueAttribute(dep, manifestName);
//                 }
//             );
//         }
//     }

//     return Array.from(allAttributes.values());
// }

function queueAttribute(
    attribute: DataSchemaData,
    manifestName: string,
    allAttributes: Map<string, DataSchemaData & { manifestName: string }>,
    queue: { attribute: DataSchemaData; manifestName: string }[]
) {
    if (!allAttributes.has(attribute.attribute)) {
        queue.push({ attribute, manifestName });
    }
}

export function getAllAttributes(
    schemaData: DataSchemaData[],
    dataSchemaMap: { [id: string]: DataSchemaData }
): (DataSchemaData & { manifestName: string })[] {
    const allAttributes = new Map<
        string,
        DataSchemaData & { manifestName: string }
    >();
    const queue: { attribute: DataSchemaData; manifestName: string }[] = [];

    schemaData.forEach((attr) =>
        queueAttribute(attr, attr.label, allAttributes, queue)
    );

    while (queue.length > 0) {
        const { attribute, manifestName } = queue.shift()!;

        if (!allAttributes.has(attribute.attribute)) {
            const attributeWithManifest = { ...attribute, manifestName };
            allAttributes.set(attribute.attribute, attributeWithManifest);

            // Add required dependencies
            attribute.requiredDependencies.forEach((depId) => {
                const dep = dataSchemaMap[depId];
                if (dep)
                    queueAttribute(dep, manifestName, allAttributes, queue);
            });

            // Add conditional dependencies
            attribute.conditionalDependencies.forEach((depId) => {
                const dep = dataSchemaMap[depId];
                if (dep)
                    queueAttribute(dep, manifestName, allAttributes, queue);
            });

            // Add exclusive conditional dependencies
            attribute.exclusiveConditionalDependencies.forEach((depId) => {
                const dep = dataSchemaMap[depId];
                if (dep)
                    queueAttribute(dep, manifestName, allAttributes, queue);
            });

            // Add dependencies from validValues
            memoizedGetDataSchemaValidValues(
                attribute,
                dataSchemaMap
            ).forEach((dep) =>
                queueAttribute(dep, manifestName, allAttributes, queue)
            );

            // Add conditional attributes
            memoizedFindConditionalAttributes(attribute, dataSchemaMap).forEach(
                (condAttrId) => {
                    const dep = dataSchemaMap[condAttrId];
                    if (dep)
                        queueAttribute(dep, manifestName, allAttributes, queue);
                }
            );
        }
    }

    return Array.from(allAttributes.values());
}

const memoizedGetAllAttributes = memoize(getAllAttributes);

export const preFetchManifestData = async (schemaData: DataSchemaData[]) => {
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
        const memoizedAllAttributes = useMemo(
            () =>
                memoizedGetAllAttributes(props.schemaData, props.dataSchemaMap),
            [props.schemaData, props.dataSchemaMap]
        );
        const [openTabs, setOpenTabs] = useState<string[]>([]);
        const [manifestData, setManifestData] = useState<{
            [key: string]: any;
        }>({});
        const isAttributeView = router.query.view === 'attribute';

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

        const manifestColumns = [ColumnName.Manifest, ColumnName.Description];

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
                </ul>
                <div className="tab-content mt-3">
                    <div
                        className={`tab-pane fade ${
                            activeTab === 'manifest' ? 'show active' : ''
                        }`}
                        role="tabpanel"
                    >
                        <DataSchemaTable
                            schemaData={props.schemaData}
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
                            schemaData={memoizedAllAttributes}
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
                                />
                            )}
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
                        schemaData={requiredDependencies}
                        dataSchemaMap={schemaDataById}
                    />
                </Col>
            </Row>
        </Container>
    );
};

export default DataSchema;
