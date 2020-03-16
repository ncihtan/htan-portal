import React from "react";
import Nav from "react-bootstrap/Nav";
import Tab from "react-bootstrap/Tab";
import Container from "react-bootstrap/Container";
import Breadcrumb from "react-bootstrap/Breadcrumb";
import Row from "react-bootstrap/Row";
import {useRouter} from "next/router";
import {getContent} from "../api_util";

export interface BaseProps {
    referrer: string;
}

const Base = (props: BaseProps) => {
    const referrer = props.referrer;
    const router = useRouter();
    const htaID = router.pathname.replace('/data/', '');

    const atlasOverviewData = getContent("atlas-overview", htaID);
    const dataOverview = getContent("data-overview", htaID);
    const publicationsData = getContent("publications", htaID);
    const primaryNGSData = getContent("primary-ngs", htaID);

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
    );
};

export default Base;
