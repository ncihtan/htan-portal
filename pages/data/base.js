import React from "react";
import Nav from "react-bootstrap/Nav";
import Tab from "react-bootstrap/Tab";
import Container from "react-bootstrap/Container";
import Breadcrumb from "react-bootstrap/Breadcrumb";

function Base(props) {
    const referrer = props.referrer;
    return (
        <Container>
            <Breadcrumb className="mt-3">
                <Breadcrumb.Item href="/">Home</Breadcrumb.Item>
                <Breadcrumb.Item href="/data">
                    Data Release
                </Breadcrumb.Item>
                <Breadcrumb.Item active>{referrer}</Breadcrumb.Item>
            </Breadcrumb>

            <Tab.Container id="left-tabs-example" defaultActiveKey="atlasOverview">
                <Nav variant="tabs" fill className="mt-4">
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
                            Atlas Overview Content - {referrer}
                        </Container>
                    </Tab.Pane>
                    <Tab.Pane eventKey="dataOverview">
                        <Container className="mt-3">
                            Data Overview Content - {referrer}
                        </Container>
                    </Tab.Pane>
                    <Tab.Pane eventKey="publications">
                        <Container className="mt-3">
                            Publications Content - {referrer}
                        </Container>
                    </Tab.Pane>
                    <Tab.Pane eventKey="clinBiospecimen">
                        <Container className="mt-3">
                            Clinical Biospecimen Content - {referrer}
                        </Container>
                    </Tab.Pane>
                    <Tab.Pane eventKey="derivedData">
                        <Container className="mt-3">
                            Derived Data Content - {referrer}
                        </Container>
                    </Tab.Pane>
                    <Tab.Pane eventKey="imagingData">
                        <Container className="mt-3">
                            Imaging Data Content - {referrer}
                        </Container>
                    </Tab.Pane>
                    <Tab.Pane eventKey="primaryNGS">
                        <Container className="mt-3">
                            Primary NGS Content - {referrer}
                        </Container>
                    </Tab.Pane>
                </Tab.Content>
            </Tab.Container>
        </Container>
    )
}

export default Base
