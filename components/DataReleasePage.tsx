import React from "react";
import Row from "react-bootstrap/Row";
import Container from "react-bootstrap/Container";
import Link from "next/link";
import Breadcrumb from "react-bootstrap/Breadcrumb";
import DataTable from "react-data-table-component";

import HtanNavbar from "./HtanNavbar";
import Footer from "./Footer";
import {CmsData, WPAtlas} from "../types";



export interface DataReleaseProps {
    data: CmsData[];
    atlasData: WPAtlas[];
}

export const DataReleasePage = (props: DataReleaseProps) => {
    const columns = [
        {
            name: 'Atlas Name',
            selector: 'atlasName',
            wrap: true,
            sortable: true,
            grow: 2,
        },
        {
            name: 'Atlas Type',
            selector: 'atlasType',
            wrap: true,
            sortable: true,
        },
        {
            name: 'Lead Institution(s)',
            selector: 'leadInstitutions',
            wrap: true,
            sortable: true,
            grow: 2,
        },
        {
            name: 'Data Release',
            selector: 'dataRelease',
            wrap: true,
            sortable: true,
            cell: (row: any) => <Link href={`./atlas/${row.dataRelease}`}><a>Data Release</a></Link>
        },
    ];

    let data = props.atlasData.reduce((agg:any[], atlas) => {
        if (atlas.synapse_id && atlas.synapse_id.length) {
            agg.push({
                id: atlas.id,
                atlasName: atlas.title.rendered,
                atlasType: atlas.atlas_type,
                leadInstitutions: atlas.lead_institutions,
                dataRelease: atlas.htan_id,
                synapseId: atlas.synapse_id
            });
        }
        return agg;
    },[]);

    return (
        <>
            <HtanNavbar/>
            <Container>
                <Row>
                    <Breadcrumb className="mt-3">
                        <Breadcrumb.Item href="/">Home</Breadcrumb.Item>
                        <Breadcrumb.Item active>
                            Data Release
                        </Breadcrumb.Item>
                    </Breadcrumb>
                </Row>

                <Row className="mt-3">
                    <h1>Data Release</h1>
                </Row>

                <Row className="mt-3">
                    <span dangerouslySetInnerHTML={{__html: props.data[0].content.rendered}}/>
                </Row>

                <Row className="mt-3">
                    <DataTable
                        paginationServerOptions={{ persistSelectedOnPageChange: false, persistSelectedOnSort: false }}
                        className="dataTables_wrapper"
                        columns={columns}
                        data={data}
                        striped={true}
                        defaultSortField={"atlasName"}
                    />
                </Row>
            </Container>
            <Footer/>
        </>
    );
}
