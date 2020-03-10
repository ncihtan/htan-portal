import React from "react";
import HTANNavbar from "../components/htanNavbar";
import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/Row";
import Breadcrumb from "react-bootstrap/Breadcrumb";

function Transfer() {
    return (
        <React.Fragment>
            <HTANNavbar/>
            <Container>
                <Row>
                    <Breadcrumb className="mt-3">
                        <Breadcrumb.Item href="/">Home</Breadcrumb.Item>
                        <Breadcrumb.Item active>
                            Data Transfer
                        </Breadcrumb.Item>
                    </Breadcrumb>
                </Row>
                <Row className="mt-3">
                    <h1>Data Transfer</h1>
                </Row>
                <Row className="mt-3">
                    <p>
                        Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut
                        labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco
                        laboris
                        nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate
                        velit
                        esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident,
                        sunt
                        in culpa qui officia deserunt mollit anim id est laborum.
                    </p>
                </Row>
            </Container>
        </React.Fragment>
    )
}

export default Transfer
