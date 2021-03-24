import React from 'react';
import { Button } from 'react-bootstrap';
import DataTable from 'react-data-table-component';
import { getDefaultDataTableStyle } from '../lib/dataTableHelpers';
import { Atlas, Entity } from '../lib/helpers';
import _ from 'lodash';

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
        },
        {
            name: 'Atlas Name',

            cell: (sample: Entity) => {
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
            name: 'Age at Diagnosis',
            selector: 'AgeatDiagnosis',
            wrap: true,
            sortable: true,
        },
        {
            name: '',
            selector: '',
            cell: (sample: Entity) => {
                const onDownload = () => {
                    // TODO init download
                };

                return (
                    <Button
                        variant="primary"
                        size="sm"
                        onClick={onDownload}
                        className="m-1"
                    >
                        Download
                    </Button>
                );
            },
        },
    ];

    return (
        <DataTable
            columns={columns}
            data={props.cases}
            striped={true}
            dense={true}
            noHeader={true}
            pagination={true}
            paginationPerPage={50}
            paginationRowsPerPageOptions={[10, 20, 50, 100, 500]}
            customStyles={getDefaultDataTableStyle()}
        />
    );
};

export default CaseTable;
