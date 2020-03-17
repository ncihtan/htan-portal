import React from "react";
import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/Row";
import Breadcrumb from "react-bootstrap/Breadcrumb";
import HtanNavbar from "../../components/HtanNavbar";
import {getContent} from "../../ApiUtil";
import Footer from "../../components/Footer";
import Link from "next/link";

const Standards = () => {
    const content = getContent("data-standards","summary-blurb");
    return (
        <>
            <HtanNavbar/>
            <Container>
                <Row>
                    <Breadcrumb className="mt-3">
                        <Breadcrumb.Item href="/">Home</Breadcrumb.Item>
                        <Breadcrumb.Item active>
                            Data Standards
                        </Breadcrumb.Item>
                    </Breadcrumb>
                </Row>

                <Row className="mt-3">
                    <h1>Data Standards</h1>
                </Row>
                <Row className="mt-3">
                    <span dangerouslySetInnerHTML={{__html: content}} />
                </Row>
                <Row className="mt-3">
                    <h4>
                        Browse HTAN Data Standards
                    </h4>
                </Row>
                <Row>
                    <ul>
                        <li>
                            <Link href="/standards/biospecimens">
                                Biospecimens
                            </Link>
                        </li>
                        <li>
                            <Link href="/standards/cds">
                                Clinical Data Standards
                            </Link>
                        </li>
                        <li>
                            <Link href="/standards/rnaseq">
                                Single Cell RNA Seq
                            </Link>
                        </li>
                        <li>
                            <Link href="/standards/imaging">
                                Imaging
                            </Link>
                        </li>
                    </ul>
                </Row>
            </Container>
            <Footer/>
        </>
    )
};

export default Standards
