import React from "react";
import HtanNavbar from "../../components/HtanNavbar";
import Footer from "../../components/Footer";
import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/Row";
import Breadcrumb from "react-bootstrap/Breadcrumb";
import {GetServerSideProps} from "next";
import fetch from "node-fetch";
import {CmsData} from "../../types";

export interface RnaseqProps {
    data: CmsData[];
}

function Rnaseq(data: RnaseqProps) {
    return (
        <>
            <HtanNavbar/>
            <Container>
                <Row>
                    <Breadcrumb className="mt-3">
                        <Breadcrumb.Item href="/">Home</Breadcrumb.Item>
                        <Breadcrumb.Item href="/standards">
                            Data Standards
                        </Breadcrumb.Item>
                        <Breadcrumb.Item active>Single Cell RNA Seq</Breadcrumb.Item>
                    </Breadcrumb>
                </Row>
                <Row>
                    <span dangerouslySetInnerHTML={{__html: data.data[0].content.rendered}}></span>
                </Row>
            </Container>
            <Footer/>
        </>
    );
}

export const getServerSideProps: GetServerSideProps = async context => {
    let slugs = ["data-standards-rnaseq-blurb"];
    let overviewURL = `https://humantumoratlas.org/wp-json/wp/v2/pages/?slug=${JSON.stringify(slugs)}&_fields=content,slug,title`;
    let res = await fetch(overviewURL);
    let data = await res.json();
    return {props: {data}}
}

export default Rnaseq;
