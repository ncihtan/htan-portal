import Link from 'next/link';
import React from 'react';
import { WPAtlas } from '../types';
import { getDefaultDataTableStyle } from '../lib/dataTableHelpers';
import DataTable from 'react-data-table-component';
import { getAtlasPageURL } from '../lib/helpers';

interface IWPAtlasTableProps {
    atlasData: WPAtlas[];
}

export const WPAtlasTable: React.FunctionComponent<IWPAtlasTableProps> = (
    props
) => {
    const columns = [
        {
            name: 'Atlas',
            selector: 'title.rendered',
            cell: (atlas: WPAtlas) => (
                <Link href={getAtlasPageURL(atlas.htan_id.toLowerCase())}>
                    <a>{atlas.title.rendered}</a>
                </Link>
            ),
            wrap: true,
            sortable: true,
        },
        {
            name: 'Lead Institution',
            selector: 'lead_institutions',
            wrap: true,
            sortable: true,
        },
        {
            name: 'Atlas ID',
            selector: 'id',
            wrap: true,
            sortable: true,
        },
    ];

    return (
        <DataTable
            columns={columns}
            data={props.atlasData}
            striped={true}
            noHeader={true}
            customStyles={getDefaultDataTableStyle()}
        />
    );
};
