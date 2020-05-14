import {useRouter} from 'next/router';
import HtanNavbar from "../../components/HtanNavbar";
import Footer from "../../components/Footer";
import getData from "../../lib/getData";
import {getAtlasContent, getAtlasList, getContent, WORDPRESS_BASE_URL} from "../../ApiUtil";
import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/Row";
import Breadcrumb from "react-bootstrap/Breadcrumb";
import Tab from "react-bootstrap/Tab";
import Nav from "react-bootstrap/Nav";
import React from "react";

import _ from 'lodash';
import {AtlasWrapper} from "../../components/Atlas";
import Head from "next/dist/next-server/lib/head";
import {Category, SynapseAtlas, SynapseData, WPAtlas} from "../../types";
import {GetStaticProps} from "next";

const data = getData();

interface IPostProps {
    synapseData:SynapseData;
    WPAtlasData:WPAtlas[];
}

const PostContent: React.FunctionComponent<{ wpAtlas:WPAtlas, synapseAtlas?:SynapseAtlas }> = ({ wpAtlas, synapseAtlas }) => {
    let mergedClinicalAndBiospecimenData: Category;
    if (synapseAtlas) {
        mergedClinicalAndBiospecimenData = Object.assign({}, synapseAtlas.clinical, synapseAtlas.biospecimen);
    }

    return (
            <Container>
                <Row>
                    <Breadcrumb className="mt-3">
                        <Breadcrumb.Item href="/">Home</Breadcrumb.Item>
                        <Breadcrumb.Item href="/data_releases">
                            Data Release
                        </Breadcrumb.Item>
                        <Breadcrumb.Item active>{
                            wpAtlas ? wpAtlas.title.rendered : ""
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
                                    {wpAtlas ?
                                        <span dangerouslySetInnerHTML={{__html: wpAtlas.atlas_overview}}/> : "Loading..."}
                                </Container>
                            </Tab.Pane>
                            <Tab.Pane eventKey="dataOverview">
                                <Container className="mt-3">
                                    {wpAtlas ?
                                        <span dangerouslySetInnerHTML={{__html: wpAtlas.data_overview}}/> : "Loading..."}
                                </Container>
                            </Tab.Pane>
                            <Tab.Pane eventKey="publications">
                                <Container className="mt-3">
                                    {wpAtlas ?
                                        <span dangerouslySetInnerHTML={{__html: wpAtlas.publications}}/> : "Loading..."}
                                </Container>
                            </Tab.Pane>
                            {
                                synapseAtlas && (
                                    <>
                                        <Tab.Pane eventKey="clinBiospecimen">
                                            <Container className="mt-3">
                                                <AtlasWrapper category={mergedClinicalAndBiospecimenData!} />
                                            </Container>
                                        </Tab.Pane>
                                        <Tab.Pane eventKey="derivedData">
                                            <Container className="mt-3">
                                                <AtlasWrapper category={synapseAtlas.assayData} />
                                            </Container>
                                        </Tab.Pane>
                                        {
                                            (synapseAtlas.imagingData) && (<Tab.Pane eventKey="imagingData">
                                                <Container className="mt-3">
                                                    <AtlasWrapper category={synapseAtlas.imagingData} />
                                                </Container>
                                            </Tab.Pane>)
                                        }
                                    </>
                                )
                            }

                            <Tab.Pane eventKey="primaryNGS">
                                <Container className="mt-3">
                                    {wpAtlas ?
                                        <span dangerouslySetInnerHTML={{__html: wpAtlas.primary_ngs}}/> : "Loading..."}
                                </Container>
                            </Tab.Pane>

                        </Tab.Content>
                    </Tab.Container>
                </Row>
            </Container>
    )
}


const Post: React.FunctionComponent<IPostProps> = ({ synapseData, WPAtlasData }) => {

    const router = useRouter();
    const htan_id = router.query.id as string;

    const postData = WPAtlasData.find((a)=>{
        return a.htan_id === htan_id;
    });

    //console.log(htan_id);


    const synapseAtlas: SynapseAtlas | undefined = postData && synapseData[htan_id.toUpperCase()] as SynapseAtlas;

    const content = postData ?
         <PostContent wpAtlas={postData} synapseAtlas={synapseAtlas}/> :
        <div>There is Atlas corresponding to this ID</div>

    return (<>
        <Head>
            <script src="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.13.0/js/all.min.js"></script>
        </Head>
        <HtanNavbar />
        <div id={"iframe-wrapper"}>
        </div>
        {
            postData &&
            synapseAtlas === undefined &&
            <div className={"alert alert-danger"}>No synapse data corresponding to ID "{postData.synapse_id}"</div>
        }
        { content }
        <Footer />
    </>)


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

    const paths = atlases.map(a=>`/atlas/${a.htan_id}`);

    return { paths, fallback: false }
}
