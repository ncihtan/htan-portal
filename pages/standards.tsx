import React from 'react';
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Breadcrumb from 'react-bootstrap/Breadcrumb';
import HtanNavbar from '../components/HtanNavbar';
import PreReleaseBanner from '../components/PreReleaseBanner';
import Footer from '../components/Footer';
import Link from 'next/link';
import { GetServerSideProps, GetStaticProps } from 'next';
import { CmsData } from '../types';
import { getStaticContent } from '../ApiUtil';
import PageWrapper from '../components/PageWrapper';

export interface StandardsProps {
    data: CmsData[];
}

const Standards = (data: StandardsProps) => {
    return (
        <>
            <PageWrapper>
                <Container>
                    <Row>
                        <Breadcrumb>
                            <Breadcrumb.Item href="/">Home</Breadcrumb.Item>
                            <Breadcrumb.Item active>
                                Data Standards
                            </Breadcrumb.Item>
                        </Breadcrumb>
                    </Row>

                    <Row>
                        <h1>Data Standards</h1>
                    </Row>
                    <Row>
                        <span
                            dangerouslySetInnerHTML={{
                                __html: data.data[0].content.rendered,
                            }}
                        />
                    </Row>

                    <Row>
                        <h2>Browse Standards</h2>
                    </Row>
                    <Row>
                        <ul>
                            <li>
                                <Link href="/standard/design">
                                    Design Principles
                                </Link>
                            </li>
                            <li>
                                <Link href="/standard/clinical">
                                    Clinical Data
                                </Link>
                            </li>
                            <li>
                                <Link href="/standard/biospecimen">
                                    Biospecimen
                                </Link>
                            </li>
                            <li>
                                <Link href="/standard/imaging">Imaging</Link>
                            </li>
                            <li>
                                <Link href="/standard/rnaseq">
                                    Single Cell and Single Nucleus RNA Seq
                                    (sc/snRNASeq)
                                </Link>
                            </li>
                            <li>
                                <Link href="/standard/scatacseq">
                                    Single Cell ATAC Seq
                                </Link>
                            </li>
                            <li>
                                <Link href="/standard/bulkrnaseq">
                                    Bulk RNA Seq
                                </Link>
                            </li>
                            <li>
                                <Link href="/standard/bulkdnaseq">
                                    Bulk DNA Seq
                                </Link>
                            </li>
                        </ul>
                    </Row>
                </Container>
            </PageWrapper>
        </>
    );
};

export const getStaticProps: GetStaticProps = async (context) => {
    const data = await getStaticContent(['summary-blurb-data-standards']);
    return { props: { data } };
};

export default Standards;
