import {useRouter} from 'next/router';
import HtanNavbar from "../../components/HtanNavbar";
import Footer from "../../components/Footer";
import getData from "../../lib/getData";
import {getAtlasContent, getContent} from "../../ApiUtil";
import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/Row";
import Breadcrumb from "react-bootstrap/Breadcrumb";
import Tab from "react-bootstrap/Tab";
import Nav from "react-bootstrap/Nav";
import React from "react";

import _ from 'lodash';
import {Atlas, AtlasDataTable} from "../../components/AtlasDataTable";
import {AtlasWrapper} from "../../components/Atlas";
import Head from "next/dist/next-server/lib/head";

const data = getData();

export default function Post() {

    const router = useRouter();
    const htaID = router.query.id;

    const postData = getAtlasContent(1158);

    const atlasData: Atlas = data.centerA as Atlas;

    return (
        <>
            <Head>
                <script src="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.13.0/js/all.min.js"></script>
            </Head>
            <HtanNavbar />
            <Container>
                <Row>
                    <Breadcrumb className="mt-3">
                        <Breadcrumb.Item href="/">Home</Breadcrumb.Item>
                        <Breadcrumb.Item href="/data">
                            Data Release
                        </Breadcrumb.Item>
                        <Breadcrumb.Item active>{
                            postData ? postData.title.rendered : ""
                        }</Breadcrumb.Item>
                    </Breadcrumb>
                </Row>

                <Row>
                    <Tab.Container defaultActiveKey="derivedData">
                        <Nav variant="tabs" fill>
                            <Nav.Item>
                                <Nav.Link eventKey="atlasOverview">Atlas Overview</Nav.Link>
                            </Nav.Item>
                            <Nav.Item>
                                <Nav.Link eventKey="dataOverview">Data Overview</Nav.Link>
                            </Nav.Item>
                            <Nav.Item>
                                <Nav.Link eventKey="publications">Publications</Nav.Link>
                            </Nav.Item>
                            <Nav.Item>
                                <Nav.Link eventKey="clinBiospecimen">Clinical Biospecimen</Nav.Link>
                            </Nav.Item>
                            <Nav.Item>
                                <Nav.Link eventKey="derivedData">Derived Data</Nav.Link>
                            </Nav.Item>
                            <Nav.Item>
                                <Nav.Link eventKey="imagingData">Imaging Data</Nav.Link>
                            </Nav.Item>
                            <Nav.Item>
                                <Nav.Link eventKey="primaryNGS">Primary NGS</Nav.Link>
                            </Nav.Item>
                        </Nav>

                        <Tab.Content>
                            <Tab.Pane eventKey="atlasOverview">
                                <Container className="mt-3">
                                    {postData ?
                                        <span dangerouslySetInnerHTML={{__html: postData.atlas_overview}}/> : "Loading..."}
                                </Container>
                            </Tab.Pane>
                            <Tab.Pane eventKey="dataOverview">
                                <Container className="mt-3">
                                    {postData ?
                                        <span dangerouslySetInnerHTML={{__html: postData.data_overview}}/> : "Loading..."}
                                </Container>
                            </Tab.Pane>
                            <Tab.Pane eventKey="publications">
                                <Container className="mt-3">
                                    {postData ?
                                        <span dangerouslySetInnerHTML={{__html: postData.publications}}/> : "Loading..."}
                                </Container>
                            </Tab.Pane>
                            <Tab.Pane eventKey="clinBiospecimen">
                                <Container className="mt-3">
                                    <AtlasWrapper category={atlasData.clinical} />
                                </Container>
                            </Tab.Pane>
                            <Tab.Pane eventKey="derivedData">
                                <Container className="mt-3">
                                    <AtlasWrapper category={atlasData.assayData} />
                                </Container>
                            </Tab.Pane>
                            <Tab.Pane eventKey="imagingData">
                                <Container className="mt-3">
                                    <AtlasWrapper category={atlasData.imagingData} />
                                </Container>
                            </Tab.Pane>
                            <Tab.Pane eventKey="primaryNGS">
                                <Container className="mt-3">
                                    <AtlasWrapper category={atlasData.biospecimen} />
                                </Container>
                            </Tab.Pane>
                        </Tab.Content>
                    </Tab.Container>
                </Row>
            </Container>
            <Footer/>
        </>
    )
////

//     return (
//         <Layout>
//         <h1>{router.query.id}</h1>
//         <p>This is the blog post content.</p>
//     </Layout>
// );
}
