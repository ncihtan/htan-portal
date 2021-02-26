import React from 'react';
import DataTable, { IDataTableColumn } from "react-data-table-component";

import {
    DataSchemaData,
    getDataSchemaDependencies,
    getDataSchemaParents,
    getDataSchemaValidValues,
    hasNonEmptyValidValues
} from "../lib/dataSchemaHelpers";
import { getDefaultDataTableStyle } from "../lib/dataTableHelpers";

export interface IDataSchemaProps {
    schemaData: DataSchemaData[];
    dataSchemaMap: {[id: string]: DataSchemaData};
}

const ExpandableComponent: React.FunctionComponent<{
    data?: DataSchemaData;
    dataSchemaMap?: {[id: string]: DataSchemaData};
}> = props => {
    return (
        <div className="m-3">
            {props.data?.requiredDependencies &&
                <DataSchemaTable
                    schemaData={getDataSchemaDependencies(props.data, props.dataSchemaMap)}
                    dataSchemaMap={props.dataSchemaMap}
                    title="Dependencies:"
                    expandableRows={false}
                />
            }

            {props.data?.parentIds &&
                <DataSchemaTable
                    schemaData={getDataSchemaParents(props.data, props.dataSchemaMap)}
                    dataSchemaMap={props.dataSchemaMap}
                    title="Parents:"
                    expandableRows={false}
                />
            }
        </div>
    );
}

const DataSchemaTable: React.FunctionComponent<{
    schemaData: DataSchemaData[];
    dataSchemaMap?: {[id: string]: DataSchemaData};
    title?: string;
    expandableRows?: boolean;
}> = props => {
    const columns: IDataTableColumn[] = [
        {
            name: "ID",
            selector: 'id',
            wrap: true,
            sortable: true,
        },
        {
            name: "Attribute",
            selector: 'attribute',
            wrap: true,
            sortable: true,
        },
        {
            name: "Label",
            selector: 'label',
            wrap: true,
            sortable: true,
        },
        {
            name: "Description",
            selector: 'description',
            grow: 2,
            wrap: true,
            sortable: true,
        },
    ];

    // conditionally show valid values column
    if (hasNonEmptyValidValues(props.schemaData)) {
        columns.push({
            name: "Valid Values",
            selector: 'validValues',
            format: (schemaData: DataSchemaData) =>
                getDataSchemaValidValues(schemaData, props.dataSchemaMap).map(s => s.label).join(", "),
            wrap: true,
            sortable: true,
        });
    }

    return (
        <DataTable
            columns={columns}
            data={props.schemaData}
            striped={true}
            dense={true}
            pagination={false}
            noHeader={!props.title}
            title={props.title ? <strong>{props.title}</strong> : undefined}
            customStyles={{
                ...getDefaultDataTableStyle(),
                header: {
                    style: {
                        fontSize: 16,
                    },
                },
            }}
            expandableRows={props.expandableRows}
            expandableRowsComponent={
                <ExpandableComponent
                    dataSchemaMap={props.dataSchemaMap}
                />
            }
        />
    );
}

const DataSchema: React.FunctionComponent<IDataSchemaProps> = props => {
    return (
        <DataSchemaTable
            schemaData={props.schemaData}
            dataSchemaMap={props.dataSchemaMap}
            title="Data Schema:"
            expandableRows={true}
        />
    );
}

export default DataSchema;
