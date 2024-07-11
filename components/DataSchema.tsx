import React from 'react';
import { observer } from 'mobx-react';
import { IDataTableColumn } from 'react-data-table-component';
import _ from 'lodash';
import Tooltip from 'rc-tooltip';
import { useRouter } from 'next/router';

import {
    DataSchemaData,
    getDataSchemaValidValues,
    getDataType,
} from '@htan/data-portal-schema';
import { getDataSchemaDataTableStyle } from '../lib/dataTableHelpers';
import Link from 'next/link';
import {
    EnhancedDataTable,
    IEnhancedDataTableColumn,
} from '@htan/data-portal-table';
import { findConditionalAttributes } from '@htan/data-portal-schema';
import TruncatedValuesList from './TruncatedValuesList';

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
    Manifest = 'Manifest',
    Attribute = 'Attribute',
    Label = 'Label',
    Description = 'Description',
    Required = 'Required',
    ConditionalIf = 'Conditional If',
    DataType = 'Data Type',
    ValidValues = 'Valid Values',
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

function getColumnDef(
    dataSchemaMap?: { [id: string]: DataSchemaData },
    isAttributeView: boolean = false
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
                const conditionalAttributes = dataSchemaMap
                    ? findConditionalAttributes(schemaData, dataSchemaMap)
                    : [];

                return (
                    <TruncatedValuesList
                        attribute={schemaData.attribute}
                        attributes={conditionalAttributes}
                        modalTitle="valid values"
                        countLabel="Number of valid options"
                    />
                );
            },
            wrap: true,
            minWidth: '250px',
            sortable: true,
            getSearchValue: (schemaData: DataSchemaData) => {
                const conditionalAttributes = dataSchemaMap
                    ? findConditionalAttributes(schemaData, dataSchemaMap)
                    : [];
                return conditionalAttributes.join(' ');
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
}> = observer((props) => {
    const { isAttributeView = false } = props;

    const availableColumns = props.columns || [
        isAttributeView ? ColumnName.Attribute : ColumnName.Manifest,
        ColumnName.Description,
        ColumnName.Required,
        ColumnName.ConditionalIf,
        ColumnName.DataType,
        ColumnName.ValidValues,
    ];

    const columnDef = getColumnDef(props.dataSchemaMap, isAttributeView);
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
        />
    );
});

const DataSchema: React.FunctionComponent<IDataSchemaProps> = observer(
    (props) => {
        const router = useRouter();
        const isAttributeView = router.query.view === 'attribute';

        return (
            <>
                <DataSchemaTable
                    schemaData={props.schemaData}
                    dataSchemaMap={props.dataSchemaMap}
                    title="Data Schema:"
                    isAttributeView={isAttributeView}
                />
            </>
        );
    }
);

export default DataSchema;
