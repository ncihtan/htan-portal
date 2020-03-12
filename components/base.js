import React from "react";
import Nav from "react-bootstrap/Nav";
import Tab from "react-bootstrap/Tab";
import Container from "react-bootstrap/Container";
import Breadcrumb from "react-bootstrap/Breadcrumb";
import Row from "react-bootstrap/Row";
import useSWR from 'swr';
import _ from 'lodash'
import fetch from 'unfetch'
import {useRouter} from "next/router";

const fetcher = url => fetch(url).then(r => r.json());

function Base(props) {
    const referrer = props.referrer;
    const router = useRouter();
    const htaID = router.pathname.replace('/data/', '');

    /**
     * Fetch content from wordpress site to populate tabs. Pages are prefixed/postfixed
     * to be easily queryable
     */
    const getContent = (tab) => {
        let overviewURL = `https://humantumoratlas.org/wp-json/wp/v2/pages/?slug=${htaID}-${tab}&_fields=content,slug,title`;
        let {data} = useSWR(overviewURL, fetcher);
        let post = _.filter(data, (o) => o.slug === `${htaID}-${tab}`);
        return post[0] ? post[0].content.rendered : ""
    };

    const atlasOverviewData = getContent("atlas-overview");
    const dataOverview = getContent("data-overview");
    const publicationsData = getContent("publications");
    const primaryNGSData = getContent("primary-ngs");

    return (
        <Container>
            <Row>
                <Breadcrumb className="mt-3">
                    <Breadcrumb.Item href="/">Home</Breadcrumb.Item>
                    <Breadcrumb.Item href="/data">
                        Data Release
                    </Breadcrumb.Item>
                    <Breadcrumb.Item active>{referrer}</Breadcrumb.Item>
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
                                {atlasOverviewData ? <span dangerouslySetInnerHTML={{__html: atlasOverviewData}}/> : "Loading..."}
                            </Container>
                        </Tab.Pane>
                        <Tab.Pane eventKey="dataOverview">
                            <Container className="mt-3">
                                {dataOverview ? <span dangerouslySetInnerHTML={{__html: dataOverview}}/> : "Loading..."}
                            </Container>
                        </Tab.Pane>
                        <Tab.Pane eventKey="publications">
                            <Container className="mt-3">
                                {publicationsData ? <span dangerouslySetInnerHTML={{__html: publicationsData}}/> : "Loading..."}
                            </Container>
                        </Tab.Pane>
                        <Tab.Pane eventKey="clinBiospecimen">
                            <Container className="mt-3">
                                SYNAPSE CLINICAL BIOSPECIMEN DATA HERE
                            </Container>
                        </Tab.Pane>
                        <Tab.Pane eventKey="derivedData">
                            <Container className="mt-3">
                                SYNAPSE DERIVED DATA HERE
                            </Container>
                        </Tab.Pane>
                        <Tab.Pane eventKey="imagingData">
                            <Container className="mt-3">
                                SYNAPSE IMAGING DATA HERE
                            </Container>
                        </Tab.Pane>
                        <Tab.Pane eventKey="primaryNGS">
                            <Container className="mt-3">
                                {primaryNGSData ? <span dangerouslySetInnerHTML={{__html: primaryNGSData}}/> : "Loading..."}
                            </Container>
                        </Tab.Pane>
                    </Tab.Content>
                </Tab.Container>
            </Row>
        </Container>
    )
}

export default Base
