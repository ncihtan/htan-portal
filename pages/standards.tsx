import React from "react";
import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/Row";
import Breadcrumb from "react-bootstrap/Breadcrumb";
import HtanNavbar from "../components/HtanNavbar";
import Footer from "../components/Footer";
import Link from "next/link";
import { GetServerSideProps, GetStaticProps } from "next";
import fetch from "node-fetch";
import { CmsData } from "../types";
import { WORDPRESS_BASE_URL } from "../ApiUtil";

export interface StandardsProps {
  data: CmsData[];
}

const Standards = (data: StandardsProps) => {
  return (
    <>
      <HtanNavbar />
      <Container>
        <Row>
          <Breadcrumb className="mt-3">
            <Breadcrumb.Item href="/">Home</Breadcrumb.Item>
            <Breadcrumb.Item active>Data Standards</Breadcrumb.Item>
          </Breadcrumb>
        </Row>

        <Row className="mt-3">
          <h1>Data Standards</h1>
        </Row>
        <Row className="mt-3">
          <span
            dangerouslySetInnerHTML={{ __html: data.data[0].content.rendered }}
          />
        </Row>
        <Row className="mt-3">
          <h4>Browse Standards</h4>
        </Row>
        <Row>
          <ul>
            <li>
              <Link href="/standard/design">Design Principles</Link>
            </li>
            <li>
              <Link href="/standard/clinical">Clinical Data</Link>
            </li>
            <li>
              <Link href="/standard/biospecimen">Biospecimen</Link>
            </li>
            <li>
              <Link href="/standard/imaging">Imaging</Link>
            </li>
            <li>
              <Link href="/standard/rnaseq">
                Single Cell and Single Nucleus RNA Seq (sc/snRNASeq)
              </Link>
            </li>
            <li>
              <Link href="/standard/scatacseq">Single Cell ATAC Seq</Link>
            </li>
            <li>
              <Link href="/standard/bulkrnaseq">Bulk RNA Seq</Link>
            </li>
            <li>
              <Link href="/standard/bulkdnaseq">Bulk DNA Seq</Link>
            </li>
          </ul>
        </Row>
      </Container>
      <Footer />
    </>
  );
};

export const getStaticProps: GetStaticProps = async (context) => {
  let slugs = ["summary-blurb-data-standards"];
  let overviewURL = `${WORDPRESS_BASE_URL}${JSON.stringify(slugs)}`;
  let res = await fetch(overviewURL);
  let data = await res.json();
  return { props: { data } };
};

export default Standards;
