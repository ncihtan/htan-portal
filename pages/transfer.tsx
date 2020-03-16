import React from "react";
import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/Row";
import Breadcrumb from "react-bootstrap/Breadcrumb";

import HtanNavbar from "../components/HtanNavbar";
import {getContent} from "../ApiUtil";

const Transfer = () => {
    const content = getContent("data-transfer","summary-blurb");
    return (
    <>
        <HtanNavbar/>
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
                <span dangerouslySetInnerHTML={{__html: content}} />
            </Row>
        </Container>
    </>
    )
};

export default Transfer
