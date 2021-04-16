import _ from 'lodash';
import React from 'react';
import { DataSchemaData, SchemaDataId } from '../lib/dataSchemaHelpers';
import {
    generateColumnsForDataSchema,
    getAtlasColumn,
    getDefaultDataTableStyle,
    sortByBiospecimenId,
    sortByHtanParentId,
} from '../lib/dataTableHelpers';
import { Atlas, Entity } from '../lib/helpers';
import EnhancedDataTable from './EnhancedDataTable';

interface IBiospecimenTableProps {
    samples: Entity[];
    synapseAtlases: Atlas[];
    schemaDataById?: { [schemaDataId: string]: DataSchemaData };
}

export const BiospecimenTable: React.FunctionComponent<IBiospecimenTableProps> = (
    props
) => {
    const columns = generateColumnsForDataSchema(
        [SchemaDataId.Biospecimen],
        props.schemaDataById,
        // need to add a custom sort function for the id
        {
            HTANBiospecimenID: {
                sortFunction: sortByBiospecimenId,
            },
            HTANParentID: {
                sortFunction: sortByHtanParentId,
            },
        },
        // Component seems to be always "Biospecimen", no need to have a column for it
        ['Component']
    );
    const indexOfHtanBiospecimenId = _.findIndex(
        columns,
        (c) => c.id === 'HTAN Biospecimen ID'
    );
    // insert Atlas Name right after HTAN Biospecimen ID
    columns.splice(
        indexOfHtanBiospecimenId + 1,
        0,
        getAtlasColumn(props.synapseAtlases)
    );

    return (
        <EnhancedDataTable
            defaultSortField={'HTANBiospecimenID'}
            columns={columns}
            data={props.samples}
            striped={true}
            dense={false}
            noHeader={true}
            pagination={true}
            paginationPerPage={50}
            paginationRowsPerPageOptions={[10, 20, 50, 100, 500]}
            customStyles={getDefaultDataTableStyle()}
        />
    );
};

export default BiospecimenTable;
