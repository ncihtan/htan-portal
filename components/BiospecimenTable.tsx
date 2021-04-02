import _ from 'lodash';
import React from 'react';
import {
    getDefaultDataTableStyle,
    sortByBiospecimenId,
} from '../lib/dataTableHelpers';
import { Atlas, Entity } from '../lib/helpers';
import EnhancedDataTable from './EnhancedDataTable';

interface IBiospecimenTableProps {
    samples: Entity[];
    synapseAtlases: Atlas[];
}

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
            sortFunction: sortByBiospecimenId,
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
            name: 'Biospecimen Type',
            selector: 'BiospecimenType',
            wrap: true,
            sortable: true,
        },
    ];

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
