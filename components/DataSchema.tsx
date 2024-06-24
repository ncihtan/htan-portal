import React, { useMemo } from 'react';
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
import { DataStandardFilterStore } from '../lib/dataStandardFilterUtils';

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
    filterStore: DataStandardFilterStore;
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
                        filterStore={props.filterStore}
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

const DataSchemaTable: React.FunctionComponent<{
    schemaData: DataSchemaData[];
    dataSchemaMap?: { [id: string]: DataSchemaData };
    title?: string;
    columns?: ColumnName[];
    filterStore: DataStandardFilterStore;
}> = observer((props) => {
    // include Attribute and Description columns by default
    // (exclude Label and Required columns by default)
    const availableColumns = props.columns || [
        ColumnName.Attribute,
        ColumnName.Description,
    ];
    // include Valid Values column only if there is data
    if (
        !availableColumns.includes(ColumnName.ValidValues) &&
        hasNonEmptyValidValues(props.schemaData)
    ) {
        availableColumns.push(ColumnName.ValidValues);
    }

    const columnDef = getColumnDef(props.dataSchemaMap);
    const columns: IDataTableColumn[] = _.uniq(availableColumns).map(
        (name) => columnDef[name]
    );

    const filteredData = props.filterStore.isFiltered
        ? Object.values(props.filterStore.filteredSchemaDataById)
        : props.schemaData;

    return (
        <DataTable
            columns={columns}
            data={filteredData}
            striped={true}
            dense={false}
            pagination={false}
            noHeader={!props.title}
            title={props.title ? <strong>{props.title}</strong> : undefined}
            customStyles={getDataSchemaDataTableStyle()}
            expandableRowDisabled={(schema) =>
                _.isEmpty(
                    getDataSchemaDependencies(schema, props.dataSchemaMap)
                )
            }
            expandableRows={!props.filterStore.isFiltered} // Only show expandable rows when not filtered
            expandableRowsComponent={
                <ExpandableComponent
                    dataSchemaMap={props.dataSchemaMap}
                    filterStore={props.filterStore}
                />
            }
        />
    );
});

const DataSchema: React.FunctionComponent<IDataSchemaProps> = observer(
    (props) => {
        const filterStore = useMemo(
            () =>
                new DataStandardFilterStore(
                    props.schemaData,
                    props.dataSchemaMap
                ),
            [props.schemaData, props.dataSchemaMap]
        );

        return (
            <>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                    <div
                        className="input-group"
                        style={{ width: 400, marginLeft: '10px' }}
                    >
                        <input
                            className="form-control py-2 border-right-0 border"
                            type="search"
                            onChange={(e) =>
                                filterStore.setSearchText(e.target.value)
                            }
                            value={filterStore.searchText}
                            placeholder="Search"
                            id="datatable-filter-text-input"
                        />
                        <div className="input-group-append">
                            <button className="input-group-text bg-transparent">
                                <FontAwesomeIcon icon={faSearch} />
                            </button>
                        </div>
                    </div>
                </div>
                <DataSchemaTable
                    schemaData={props.schemaData}
                    dataSchemaMap={props.dataSchemaMap}
                    title="Data Schema:"
                    filterStore={filterStore}
                />
            </>
        );
    }
);

export default DataSchema;
