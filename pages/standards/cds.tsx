import React from "react";
import HtanNavbar from "../../components/HtanNavbar";
import Footer from "../../components/Footer";
import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/Row";
import Breadcrumb from "react-bootstrap/Breadcrumb";
import {GetServerSideProps} from "next";
import fetch from "node-fetch";
import {CmsData} from "../../types";
import {WORDPRESS_BASE_URL} from "../../ApiUtil";

export interface CdsProps {
    data: CmsData[];
}

function Cds(data: CdsProps) {
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
                        <Breadcrumb.Item active>Clinical Data Standards</Breadcrumb.Item>
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
    let slugs = ["data-standards-cds-blurb"];
    let overviewURL = `${WORDPRESS_BASE_URL}${JSON.stringify(slugs)}`;
    let res = await fetch(overviewURL);
    let data = await res.json();
    return {props: {data}}
}

export default Cds;
