import React from 'react';
import DataTable from "react-data-table-component";

import { ExtendedDataSchema } from "../lib/dataSchemaHelpers";
import { getDefaultDataTableStyle } from "../lib/dataTableHelpers";

export interface IDataSchemaProps {
    schemaData: ExtendedDataSchema[];
}

const ExpandableComponent: React.FunctionComponent<{data?: ExtendedDataSchema}> = props => {
    return (
        <div className="m-3">
            {props.data?.dependencies &&
                <DataSchemaTable
                    schemaData={props.data.dependencies.map(d => ({dataSchema: d}))}
                    title="Dependencies:"
                    expandableRows={false}
                />
            }

            {props.data?.parents &&
                <DataSchemaTable
                    schemaData={props.data.parents.map(p => ({dataSchema: p}))}
                    title="Parents:"
                    expandableRows={false}
                />
            }
        </div>
    );
}

const DataSchemaTable: React.FunctionComponent<{
    schemaData: ExtendedDataSchema[];
    title?: string;
    expandableRows?: boolean;
}> = props => {
    const columns = [
        {
            name: "ID",
            selector: 'dataSchema.id',
            wrap: true,
            sortable: true,
        },
        {
            name: "Attribute",
            selector: 'dataSchema.attribute',
            wrap: true,
            sortable: true,
        },
        {
            name: "Label",
            selector: 'dataSchema.label',
            wrap: true,
            sortable: true,
        },
        {
            name: "Description",
            selector: 'dataSchema.description',
            grow: 2,
            wrap: true,
            sortable: true,
        },
        {
            name: "Type",
            selector: 'dataSchema.type',
            wrap: true,
            sortable: true,
        },
        {
            name: "Valid Values",
            selector: 'dataSchema.validValues',
            format: (schemaData: ExtendedDataSchema) => schemaData.dataSchema?.validValues.join(", "),
            wrap: true,
            sortable: true,
        },
    ];

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
            expandableRowsComponent={<ExpandableComponent />}
        />
    );
}

const DataSchema: React.FunctionComponent<IDataSchemaProps> = props => {
    return (
        <DataSchemaTable
            schemaData={props.schemaData}
            title="Data Schema:"
            expandableRows={true}
        />
    );
}

export default DataSchema;
