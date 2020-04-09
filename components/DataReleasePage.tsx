import React from "react";
import Row from "react-bootstrap/Row";
import Container from "react-bootstrap/Container";
import Link from "next/link";
import Breadcrumb from "react-bootstrap/Breadcrumb";
import _ from 'lodash'

import HtanNavbar from "./HtanNavbar";
import Footer from "./Footer";
import {CmsData, WPAtlas} from "../types";


export interface DataReleaseProps {
    data: CmsData[];
    atlasData: WPAtlas[];
}

export const DataReleasePage = (props: DataReleaseProps) => {

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
                    <table className={"table table-striped"}>
                        <thead>
                        <tr>
                            <th>Atlas Name</th>
                            <th>Atlas Type</th>
                            <th>Lead Institution(s)</th>
                            <th>Data Release</th>
                        </tr>
                        </thead>
                        <tbody>

                        {
                            props.atlasData.map((atlas)=><tr key={`atlas-${atlas.htan_id}`}>
                                <td>
                                    {
                                        atlas.title.rendered
                                    }
                                </td>
                                <td>{ atlas.atlas_type }</td>
                                <td>{ atlas.lead_institutions }</td>
                                <td>
                                    <Link href={ `./atlas/${atlas.htan_id}` }>
                                        <a>Data Release</a>
                                    </Link>
                                </td>
                            </tr>
                            )
                        }
                        </tbody>
                    </table>
                </Row>
            </Container>
            <Footer/>
        </>
    );
}
