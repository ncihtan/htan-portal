import _ from 'lodash';
import React from 'react';
import {
    getDefaultDataTableStyle,
    sortByHtanParticipantId,
} from '../lib/dataTableHelpers';
import { Atlas, Entity, convertAgeInDaysToYears } from '../lib/helpers';
import EnhancedDataTable from './EnhancedDataTable';

interface ICaseTableProps {
    cases: Entity[];
    synapseAtlases: Atlas[];
}

export const CaseTable: React.FunctionComponent<ICaseTableProps> = (props) => {
    const atlasMap = _.keyBy(props.synapseAtlases, (a) => a.htan_id);

    const columns = [
        {
            name: 'HTAN Participant ID',
            selector: 'HTANParticipantID',
            wrap: true,
            sortable: true,
            sortFunction: sortByHtanParticipantId,
        },
        {
            name: 'Atlas Name',
            selector: (sample: Entity) => {
                return atlasMap[sample.atlasid].htan_name;
            },
            wrap: true,
            sortable: true,
        },
        {
            name: 'Primary Diagnosis',
            selector: 'PrimaryDiagnosis',
            wrap: true,
            sortable: true,
        },
        {
            name: 'Age at Diagnosis (years)',
            selector: 'AgeatDiagnosis',
            format: (sample: Entity) =>
                convertAgeInDaysToYears(sample.AgeatDiagnosis),
            wrap: true,
            sortable: true,
        },
    ];

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
