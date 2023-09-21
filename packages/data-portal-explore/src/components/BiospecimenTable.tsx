import _ from 'lodash';
import React from 'react';

import { getDefaultDataTableStyle } from '../../../data-portal-table/src/libs/helpers';
import { Atlas, Entity } from '../../../data-portal-commons/src/libs/entity';
import { GenericAttributeNames } from '../../../data-portal-utils/src/libs/types';
import {
    DataSchemaData,
    SchemaDataId,
} from '../../../data-portal-schema/src/libs/dataSchemaHelpers';
import EnhancedDataTable from '../../../data-portal-table/src/components/EnhancedDataTable';

import {
    generateColumnsForDataSchema,
    getAtlasColumn,
    sortByBiospecimenId,
    sortByParentID,
} from '../libs/dataTableHelpers';

interface IBiospecimenTableProps {
    samples: Entity[];
    synapseAtlases: Atlas[];
    schemaDataById?: { [schemaDataId: string]: DataSchemaData };
    genericAttributeMap?: { [attr: string]: GenericAttributeNames };
}

export const BiospecimenTable: React.FunctionComponent<IBiospecimenTableProps> = (
    props
) => {
    const columns = generateColumnsForDataSchema(
        [SchemaDataId.Biospecimen],
        props.schemaDataById,
        props.genericAttributeMap,
        // need to add a custom sort function for the id
        {
            [GenericAttributeNames.BiospecimenID]: {
                sortFunction: sortByBiospecimenId,
            },
            [GenericAttributeNames.ParentID]: {
                sortFunction: sortByParentID,
            },
        },
        // Component seems to be always "Biospecimen", no need to have a column for it
        ['Component']
    );
    const indexOfBiospecimenId = _.findIndex(
        columns,
        (c) => c.selector === GenericAttributeNames.BiospecimenID
    );
    // insert Atlas Name right after Biospecimen ID
    columns.splice(
        indexOfBiospecimenId + 1,
        0,
        getAtlasColumn(props.synapseAtlases)
    );

    return (
        <EnhancedDataTable
            defaultSortField={GenericAttributeNames.BiospecimenID}
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
