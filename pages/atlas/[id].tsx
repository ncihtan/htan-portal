import {useRouter} from 'next/router';
import HtanNavbar from "../../components/HtanNavbar";
import Footer from "../../components/Footer";
import getData from "../../lib/getData";
import {getAtlasContent, getAtlasList, getContent, WORDPRESS_BASE_URL, WPAtlas} from "../../ApiUtil";
import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/Row";
import Breadcrumb from "react-bootstrap/Breadcrumb";
import Tab from "react-bootstrap/Tab";
import Nav from "react-bootstrap/Nav";
import React from "react";

import _ from 'lodash';
import {AtlasWrapper} from "../../components/Atlas";
import Head from "next/dist/next-server/lib/head";
import {Atlas, SynapseData} from "../../types";
import {GetStaticProps} from "next";
import fetch from "node-fetch";

const data = getData();

interface IPostProps {
    synapseData:SynapseData;
    WPAtlasData:WPAtlas[];
}

const Post: React.FunctionComponent<IPostProps> = ({ synapseData, WPAtlasData }) => {

    const router = useRouter();
    const htaID = router.query.id as string;

    const postData = WPAtlasData.find((a)=>{
        return a.synapse_id === htaID;
    });

    const atlasData: Atlas = synapseData[htaID] as Atlas;

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
                        <Breadcrumb.Item href="/data_releases">
                            Data Release
                        </Breadcrumb.Item>
                        <Breadcrumb.Item active>{
                            postData ? postData.title.rendered : ""
                        }</Breadcrumb.Item>
                    </Breadcrumb>
                </Row>

                <Row>
                    <Tab.Container defaultActiveKey="atlasOverview">
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
}

export default Post;

export const getStaticProps: GetStaticProps = async context => {

    const WPAtlasData = await getAtlasList();
    const synapseData = getData();

    return {
        props: {
            WPAtlasData,
            synapseData
        }
    }
}

export async function getStaticPaths() {

    const atlases = await getAtlasList();

    const paths = atlases.map(a=>`/atlas/${a.synapse_id}`);

    return { paths, fallback: false }
}
