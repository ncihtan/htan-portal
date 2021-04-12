import _ from 'lodash';
import React from 'react';
import { DataSchemaData, SchemaDataId } from '../lib/dataSchemaHelpers';
import {
    generateColumnsByDataSchema,
    getAtlasColumn,
    getDefaultDataTableStyle,
    sortByHtanParticipantId,
} from '../lib/dataTableHelpers';
import { Atlas, Entity, convertAgeInDaysToYears } from '../lib/helpers';
import EnhancedDataTable from './EnhancedDataTable';

interface ICaseTableProps {
    cases: Entity[];
    synapseAtlases: Atlas[];
    schemaDataById?: { [schemaDataId: string]: DataSchemaData };
}

export const CaseTable: React.FunctionComponent<ICaseTableProps> = (props) => {
    const columns = generateColumnsByDataSchema(
        SchemaDataId.Diagnosis,
        props.schemaDataById,
        // need to add a custom sort function for the id
        {
            HTANParticipantID: {
                sortFunction: sortByHtanParticipantId,
            },
            AgeatDiagnosis: {
                name: 'Age at Diagnosis (years)',
                format: (sample: Entity) =>
                    convertAgeInDaysToYears(sample.AgeatDiagnosis),
            },
        },
        // Component seems to be always "Diagnosis", no need to have a column for it
        ['Component']
    );
    const indexOfHtanParticipantId = _.findIndex(
        columns,
        (c) => c.id === 'HTANParticipantID'
    );
    // insert Atlas Name right after HTAN Participant ID
    columns.splice(
        indexOfHtanParticipantId + 1,
        0,
        getAtlasColumn(props.synapseAtlases)
    );

    return (
        <EnhancedDataTable
            columns={columns}
            defaultSortField={'HTANParticipantID'}
            data={props.cases}
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

export default CaseTable;
