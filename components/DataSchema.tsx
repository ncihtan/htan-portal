import _ from 'lodash';
import React from 'react';
import DataTable, { IDataTableColumn } from 'react-data-table-component';

import {
    DataSchemaData,
    getDataSchemaDependencies,
    getDataSchemaValidValues,
    hasNonEmptyValidValues,
} from '../packages/data-portal-schema/src/libs/dataSchemaHelpers';
import { getDataSchemaDataTableStyle } from '../lib/dataTableHelpers';
import ValidValues from './ValidValues';

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

const ExpandableComponent: React.FunctionComponent<{
    data?: DataSchemaData;
    dataSchemaMap?: { [id: string]: DataSchemaData };
}> = (props) => {
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
            // TODO it may not be accurate to use the `required` field because an attribute may be listed as a
            //  required dependency for the parent attribute even if `required` field is false
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
}> = (props) => {
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

    return (
        <DataTable
            columns={columns}
            data={props.schemaData}
            striped={true}
            dense={false}
            pagination={false}
            noHeader={!props.title}
            title={props.title ? <strong>{props.title}</strong> : undefined}
            customStyles={getDataSchemaDataTableStyle()}
            expandableRowDisabled={(schema) => {
                // disable expandable row toggle if schema does not have any dependencies
                return _.isEmpty(
                    getDataSchemaDependencies(schema, props.dataSchemaMap)
                );
            }}
            expandableRows={true}
            expandableRowsComponent={
                <ExpandableComponent dataSchemaMap={props.dataSchemaMap} />
            }
        />
    );
};

const DataSchema: React.FunctionComponent<IDataSchemaProps> = (props) => {
    return (
        <DataSchemaTable
            schemaData={props.schemaData}
            dataSchemaMap={props.dataSchemaMap}
            title="Data Schema:"
        />
    );
};

export default DataSchema;
