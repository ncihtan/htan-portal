import _ from 'lodash';
import React from 'react';
import { getDefaultDataTableStyle } from '../lib/dataTableHelpers';
import { Atlas, Entity } from '../lib/helpers';
import EnhancedDataTable from './EnhancedDataTable';

interface IBiospecimenTableProps {
    samples: Entity[];
    synapseAtlases: Atlas[];
}

const sortFunction = (rows: any[], field: string, direction: any) => {
    if (field === 'HTANBiospecimenID') {
        return _.sortBy(rows, [
            (row) =>
                Number(
                    row['HTANBiospecimenID'].split('_')[0].replace('HTA', '')
                ),
            (row) => Number(row['HTANBiospecimenID'].split('_')[1]),
            (row) => Number(row['HTANBiospecimenID'].split('_')[2]),
        ]);
    } else {
        return rows.slice(0);
    }
};

export const BiospecimenTable: React.FunctionComponent<IBiospecimenTableProps> = (
    props
) => {
    const atlasMap = _.keyBy(props.synapseAtlases, (a) => a.htan_id);

    const columns = [
        {
            name: 'HTAN Biospecimen ID',
            selector: 'HTANBiospecimenID',
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
            name: 'Biospecimen Type',
            selector: 'BiospecimenType',
            wrap: true,
            sortable: true,
        },
    ];

    return (
        <EnhancedDataTable
            defaultSortField={'HTANBiospecimenID'}
            sortFunction={sortFunction}
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
