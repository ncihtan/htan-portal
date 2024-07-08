import React from 'react';
import { observer } from 'mobx-react';
import { IDataTableColumn } from 'react-data-table-component';
import _ from 'lodash';

import {
    DataSchemaData,
    getDataSchemaValidValues,
} from '@htan/data-portal-schema';
import { getDataSchemaDataTableStyle } from '../lib/dataTableHelpers';
import ValidValues from './ValidValues';
import Link from 'next/link';
import { EnhancedDataTable } from '@htan/data-portal-table';
import ConditionalIfValues from './ConditionalIf';

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

enum ColumnName {
    Attribute = 'Attribute',
    Label = 'Label',
    Description = 'Description',
    Required = 'Required',
    ConditionalIf = 'Conditional If',
    DataType = 'Data Type',
    ValidValues = 'Valid Values',
}

enum ColumnSelector {
    Attribute = 'attribute',
    Label = 'label',
    Description = 'description',
    Required = 'required',
    ConditionalIf = 'conditionalIf',
    DataType = 'dataType',
    ValidValues = 'validValues',
}

function getColumnDef(dataSchemaMap?: {
    [id: string]: DataSchemaData;
}): { [name in ColumnName]: IDataTableColumn } {
    return {
        [ColumnName.Attribute]: {
            name: ColumnName.Attribute,
            selector: ColumnSelector.Attribute,
            cell: (schemaData: DataSchemaData) => (
                <Link href={`/standard/${schemaData.id}`}>
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
        [ColumnName.ConditionalIf]: {
            name: ColumnName.ConditionalIf,
            selector: ColumnSelector.ConditionalIf,
            cell: (schemaData: DataSchemaData) => {
                const conditionalIfList = [];

                // Check if this schema is a dependency of any other schema
                if (dataSchemaMap) {
                    for (const [key, value] of Object.entries(dataSchemaMap)) {
                        if (
                            value.requiredDependencies &&
                            Array.isArray(value.requiredDependencies)
                        ) {
                            const isDependency = value.requiredDependencies.some(
                                (dep) =>
                                    (typeof dep === 'string'
                                        ? dep
                                        : dep['@id']) === schemaData.id
                            );
                            if (isDependency && value.attribute) {
                                conditionalIfList.push(value.attribute);
                            }
                        }
                    }
                }

                return (
                    <ConditionalIfValues
                        attribute={schemaData.attribute}
                        attributes={conditionalIfList}
                    />
                );
            },
            wrap: true,
            minWidth: '250px',
            sortable: true,
        },
        [ColumnName.DataType]: {
            name: ColumnName.DataType,
            selector: ColumnSelector.DataType,
            wrap: true,
            sortable: true,
            format: (schemaData: DataSchemaData) => {
                if (
                    schemaData.validationRules &&
                    Array.isArray(schemaData.validationRules)
                ) {
                    const dataType = schemaData.validationRules.find(
                        (rule) => typeof rule === 'object' && 'type' in rule
                    );

                    if (
                        dataType &&
                        typeof dataType === 'object' &&
                        'type' in dataType
                    ) {
                        switch (dataType) {
                            case 'int':
                                return 'Integer';
                            default:
                                return 'String';
                        }
                    }

                    // If no specific type is found, check if it's an enum (array of allowed values)
                    if (
                        schemaData.validationRules.some((rule) =>
                            Array.isArray(rule)
                        )
                    ) {
                        return 'Enum';
                    }
                }

                // Default to String if no validation rules or unrecognized type
                return 'String';
            },
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
            minWidth: '300px',
            sortable: true,
        },
    };
}

const DataSchemaTable: React.FunctionComponent<{
    schemaData: DataSchemaData[];
    dataSchemaMap?: { [id: string]: DataSchemaData };
    title?: string;
    columns?: ColumnName[];
}> = observer((props) => {
    // include Attribute, Description, and Valid Values columns by default
    const availableColumns = props.columns || [
        ColumnName.Attribute,
        ColumnName.Description,
        ColumnName.Required,
        ColumnName.ConditionalIf,
        ColumnName.DataType,
        ColumnName.ValidValues,
    ];

    const columnDef = getColumnDef(props.dataSchemaMap);
    const columns: IDataTableColumn[] = _.uniq(availableColumns).map(
        (name) => columnDef[name]
    );

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
        />
    );
});

const DataSchema: React.FunctionComponent<IDataSchemaProps> = observer(
    (props) => {
        return (
            <>
                <DataSchemaTable
                    schemaData={props.schemaData}
                    dataSchemaMap={props.dataSchemaMap}
                    title="Data Schema:"
                />
            </>
        );
    }
);

export default DataSchema;
