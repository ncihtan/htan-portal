import React from 'react';
import DataTable, { IDataTableColumn } from "react-data-table-component";

import {
    DataSchemaData,
    getDataSchemaDependencies,
    getDataSchemaValidValues,
    hasNonEmptyValidValues
} from "../lib/dataSchemaHelpers";
import { getDefaultDataTableStyle } from "../lib/dataTableHelpers";
import ExpandableText from "./ExpandableText";

export interface IDataSchemaProps {
    schemaData: DataSchemaData[];
    dataSchemaMap: {[id: string]: DataSchemaData};
}

const ExpandableComponent: React.FunctionComponent<{
    data?: DataSchemaData;
    dataSchemaMap?: {[id: string]: DataSchemaData};
}> = props => {
    return props.data?.requiredDependencies ? (
        <div className="m-3">
            <DataSchemaTable
                schemaData={getDataSchemaDependencies(props.data, props.dataSchemaMap)}
                dataSchemaMap={props.dataSchemaMap}
                root={false}
            />
        </div>
    ): null;
}

const DataSchemaTable: React.FunctionComponent<{
    schemaData: DataSchemaData[];
    dataSchemaMap?: {[id: string]: DataSchemaData};
    title?: string;
    root?: boolean;
}> = props => {
    const columns: IDataTableColumn[] = [
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

    // add required column only if this is not a root table
    if (!props.root) {
        columns.push({
            name: "Required",
            selector: 'required',
            wrap: true,
            sortable: true,
            format: (schemaData: DataSchemaData) => schemaData.required ? "Yes": "No",
        })
    }

    // conditionally show valid values column
    if (hasNonEmptyValidValues(props.schemaData)) {
        columns.push({
            name: "Valid Values",
            selector: 'validValues',
            cell: (schemaData: DataSchemaData) => {
                const text = getDataSchemaValidValues(schemaData, props.dataSchemaMap)
                    .map(s => s.label)
                    .join(", ");

                return <ExpandableText fullText={text} />;
            },
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
            expandableRows={props.root}
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
            root={true}
        />
    );
}

export default DataSchema;
