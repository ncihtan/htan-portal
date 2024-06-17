import React, { useState } from 'react';
import { observer } from 'mobx-react';
import DataTable, { IDataTableColumn } from 'react-data-table-component';
import _ from 'lodash';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSearch } from '@fortawesome/free-solid-svg-icons';

import {
    DataSchemaData,
    getDataSchemaDependencies,
    getDataSchemaValidValues,
    hasNonEmptyValidValues,
} from '@htan/data-portal-schema';
import { getDataSchemaDataTableStyle } from '../lib/dataTableHelpers';
import ValidValues from './ValidValues';
import { FilterSearch, OptionType } from '@htan/data-portal-filter';
import { DataStandardFilterControl } from 'packages/data-portal-filter/src/components/DataStandardFilterControl';

export interface IDataSchemaProps {
    schemaData: DataSchemaData[];
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

interface ExpandableComponentProps {
    data?: DataSchemaData;
    dataSchemaMap?: { [id: string]: DataSchemaData };
    filterControl: DataStandardFilterControl;
}

const ExpandableComponent: React.FunctionComponent<ExpandableComponentProps> = (
    props
) => {
    let component = null;

    if (props.data) {
        const dependencies = getDataSchemaDependencies(
            props.data,
            props.dataSchemaMap
        );

        if (!_.isEmpty(dependencies)) {
            component = (
                <div className="m-3">
                    <DataSchemaTable
                        schemaData={dependencies}
                        dataSchemaMap={props.dataSchemaMap}
                        filterControl={props.filterControl}
                    />
                </div>
            );
        }
    }

    return component;
};

enum ColumnName {
    Attribute = 'Attribute',
    Label = 'Label',
    Description = 'Description',
    Required = 'Required',
    ValidValues = 'Valid Values',
}

enum ColumnSelector {
    Attribute = 'attribute',
    Label = 'label',
    Description = 'description',
    Required = 'required',
    ValidValues = 'validValues',
}

function getColumnDef(dataSchemaMap?: {
    [id: string]: DataSchemaData;
}): { [name in ColumnName]: IDataTableColumn } {
    return {
        [ColumnName.Attribute]: {
            name: ColumnName.Attribute,
            selector: ColumnSelector.Attribute,
            format: (schemaData: DataSchemaData) =>
                ATTRIBUTE_OVERRIDES[schemaData.attribute] ||
                schemaData.attribute,
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
                schemaData.required ? 'Yes' : 'No',
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
                    <ValidValues
                        attribute={schemaData.attribute}
                        attributes={attributes}
                    />
                );
            },
            wrap: true,
            minWidth: '400px',
            sortable: true,
        },
    };
}

interface DataSchemaTableProps {
    schemaData: DataSchemaData[];
    dataSchemaMap?: { [id: string]: DataSchemaData };
    title?: string;
    columns?: ColumnName[];
    filterControl: DataStandardFilterControl;
}

const DataSchemaTable: React.FunctionComponent<DataSchemaTableProps> = observer(
    (props) => {
        const availableColumns = props.columns || [
            ColumnName.Attribute,
            ColumnName.Description,
            ColumnName.ValidValues,
        ];

        const columnDef = getColumnDef(props.dataSchemaMap);
        const columns: IDataTableColumn[] = _.uniq(availableColumns).map(
            (name) => columnDef[name]
        );

        const filteredSchemaDataById =
            props.filterControl.selectedAttributes.length > 0
                ? Object.fromEntries(
                      Object.entries(props.dataSchemaMap || {}).filter(
                          ([key, value]) => {
                              const attribute = value.attribute;
                              const isMatching = props.filterControl.selectedAttributes.some(
                                  (filter) => {
                                      const modifiedValue =
                                          'bts:' + filter.replace(/\s+/g, '');
                                      return modifiedValue === key;
                                  }
                              );
                              return isMatching;
                          }
                      )
                  )
                : Object.fromEntries(
                      Object.entries(props.dataSchemaMap || {}).filter(
                          ([key, value]) => {
                              const attribute = value.attribute;
                              return props.schemaData.some(
                                  (data) => data.attribute === attribute
                              );
                          }
                      )
                  );

        const isFiltered = props.filterControl.selectedAttributes.length > 0;

        return (
            <>
                <DataTable
                    columns={columns}
                    data={Object.values(filteredSchemaDataById)}
                    striped={true}
                    dense={false}
                    pagination={false}
                    noHeader={!props.title}
                    title={
                        props.title ? <strong>{props.title}</strong> : undefined
                    }
                    customStyles={getDataSchemaDataTableStyle()}
                    expandableRowDisabled={(schema) =>
                        _.isEmpty(
                            getDataSchemaDependencies(
                                schema,
                                props.dataSchemaMap
                            )
                        )
                    }
                    expandableRows={!isFiltered}
                    expandableRowsComponent={
                        <ExpandableComponent
                            dataSchemaMap={props.dataSchemaMap}
                            filterControl={props.filterControl}
                        />
                    }
                />
            </>
        );
    }
);

const DataSchema: React.FunctionComponent<IDataSchemaProps> = observer(
    (props) => {
        const [searchText, setSearchText] = useState('');
        const filterControl = new DataStandardFilterControl(
            props.schemaData,
            props.dataSchemaMap
        );

        const handleSearch = () => {
            const matchingFilters = filterControl.allAttributeNames.filter(
                (attribute) =>
                    attribute.toLowerCase().includes(searchText.toLowerCase())
            );
            filterControl.updateSelectedAttributesDirectly(matchingFilters);
        };

        const handleKeyDown = (
            event: React.KeyboardEvent<HTMLInputElement>
        ) => {
            if (event.key === 'Enter') {
                handleSearch();
            }
        };

        return (
            <>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                    <FilterSearch
                        selectOptions={[
                            {
                                label: 'Attributes',
                                options: filterControl.allAttributeNames.map(
                                    (attribute: string) => ({
                                        label: attribute,
                                        value: attribute,
                                        group: 'Attributes',
                                    })
                                ),
                            },
                        ]}
                        setFilter={filterControl.handleFilterChange}
                    />
                    <div
                        className="input-group"
                        style={{ width: 400, marginLeft: '10px' }}
                    >
                        <input
                            className="form-control py-2 border-right-0 border"
                            type="search"
                            onChange={(e) => setSearchText(e.target.value)}
                            value={searchText}
                            placeholder="Search"
                            onKeyDown={handleKeyDown}
                            id="datatable-filter-text-input"
                        />
                        <div className="input-group-append">
                            <button
                                className="input-group-text bg-transparent"
                                onClick={handleSearch}
                            >
                                <FontAwesomeIcon icon={faSearch} />
                            </button>
                        </div>
                    </div>
                </div>
                <DataSchemaTable
                    schemaData={props.schemaData}
                    dataSchemaMap={props.dataSchemaMap}
                    title="Data Schema:"
                    filterControl={filterControl}
                />
            </>
        );
    }
);

export default DataSchema;
