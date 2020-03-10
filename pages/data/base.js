import React from "react";
import Nav from "react-bootstrap/Nav";
import Tab from "react-bootstrap/Tab";
import Container from "react-bootstrap/Container";
import Breadcrumb from "react-bootstrap/Breadcrumb";
import Row from "react-bootstrap/Row";
import useSWR from 'swr';
import _ from 'lodash'

const fetcher = url => fetch(url).then(r => r.json());

function Base(props) {
    const referrer = props.referrer;

    /**
     * Pull content from wordpress site to populate tabs. Pages are prefixed/postfixed
     * to be easily queryable
     */
    const getContent = (prefix) => {
        let post = _.filter(data, (o) => {
            return o.slug === `${prefix}-${referrer.toLowerCase()}`
        });

        //parse HTML using browser and tmp div
        let to_return = "";
        if (post[0]) {
            let div = document.createElement("div");
            div.innerHTML = post[0].content.rendered;
            to_return = div.textContent || div.innerText || "";
        }

        return to_return
    };

    const overviewURL = `https://humantumoratlas.org/wp-json/wp/v2/pages?_fields=content,slug`;
    const {data} = useSWR(overviewURL, fetcher);

    const atlasOverviewData = getContent("atlas-overview");
    const dataOverview = getContent("data-overview");
    const publicationsData = getContent("publications");
    const clinBioData = getContent("clinical-biospecimen");
    const derivedData = getContent("derived-data");
    const imagingData = getContent("imaging-data");
    const primaryNGSData = getContent("primary-ngs-data");

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
                <Tab.Container id="left-tabs-example" defaultActiveKey="atlasOverview">
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
                                {atlasOverviewData}
                            </Container>
                        </Tab.Pane>
                        <Tab.Pane eventKey="dataOverview">
                            <Container className="mt-3">
                                {dataOverview}
                            </Container>
                        </Tab.Pane>
                        <Tab.Pane eventKey="publications">
                            <Container className="mt-3">
                                {publicationsData}
                            </Container>
                        </Tab.Pane>
                        <Tab.Pane eventKey="clinBiospecimen">
                            <Container className="mt-3">
                                {clinBioData}
                            </Container>
                        </Tab.Pane>
                        <Tab.Pane eventKey="derivedData">
                            <Container className="mt-3">
                                {derivedData}
                            </Container>
                        </Tab.Pane>
                        <Tab.Pane eventKey="imagingData">
                            <Container className="mt-3">
                                {imagingData}
                            </Container>
                        </Tab.Pane>
                        <Tab.Pane eventKey="primaryNGS">
                            <Container className="mt-3">
                                {primaryNGSData}
                            </Container>
                        </Tab.Pane>
                    </Tab.Content>
                </Tab.Container>
            </Row>
        </Container>
    )
}

export default Base
