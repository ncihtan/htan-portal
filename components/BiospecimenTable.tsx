import React from "react";
import {Button} from "react-bootstrap";
import DataTable from "react-data-table-component";
import {getDefaultDataTableStyle} from "../lib/dataTableHelpers";
import {Entity} from "../lib/helpers";

interface IBiospecimenTableProps {
    samples: Entity[];
}

export const BiospecimenTable: React.FunctionComponent<IBiospecimenTableProps> = props => {
    const columns = [
        {
            name: "HTAN Biospecimen ID",
            selector: 'HTANBiospecimenID',
            wrap: true,
            sortable: true,
        },
        {
            name: "Atlas ID",
            selector: 'atlasid',
            wrap: true,
            sortable: true,
        },
        {
            name: "Biospecimen Type",
            selector: 'BiospecimenType',
            wrap: true,
            sortable: true,
        },
        {
            name: "",
            selector: "",
            cell: (sample: Entity) => {
                const onDownload = () => {
                    // TODO init download
                }

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
            }
        },
    ];

    return (
        <DataTable
            columns={columns}
            data={props.samples}
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

export default BiospecimenTable;
