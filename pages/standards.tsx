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
            <PreReleaseBanner />
            <PageWrapper>
                <Container>
                    <Row>
                        <div className="standards-content">
                            <h1>HTAN Data Standards</h1>

                            <p>
                                All HTAN Centers are required to encode their
                                data and metadata in the common HTAN Data Model.
                                The HTAN Data Model was created via a community
                                Request for Comment (RFC) process, with
                                participation from all HTAN Centers, and covers{' '}
                                <Link href="/standard/clinical">
                                    clinical data
                                </Link>
                                ,{' '}
                                <Link href="/standard/biospecimen">
                                    biospecimen data
                                </Link>
                                ,{' '}
                                <Link href="/standard/sequencing">
                                    genomic sequencing data
                                </Link>{' '}
                                and{' '}
                                <Link href="/standard/imaging">
                                    multiplex imaging data
                                </Link>
                                .
                            </p>
                            <p>
                                As much as possible, the HTAN Data Model
                                leverages previously defined data standards
                                across the scientific research community,
                                including the{' '}
                                <a href="https://gdc.cancer.gov/">
                                    NCI Genomic Data Commons
                                </a>
                                , the{' '}
                                <a href="https://www.humancellatlas.org/">
                                    Human Cell Atlas
                                </a>
                                , the{' '}
                                <a href="https://hubmapconsortium.org/">
                                    Human Biomolecular Atlas Program (HuBMAP)
                                </a>{' '}
                                and the{' '}
                                <a href="https://www.miti-consortium.org/">
                                    Minimum Information about Tissue Imaging
                                    (MITI)
                                </a>{' '}
                                reporting guidelines.
                            </p>

                            <p>
                                HTAN uses{' '}
                                <a href="https://bioschemas.org/">bioschemas</a>{' '}
                                to define the data model. Bioschema extends{' '}
                                <a href="https://schema.org/">schema.org</a>, a
                                community effort used by many search engines
                                that provides a way to define information with
                                properties. Bioschemas define profiles over
                                types that state which properties must be used
                                (minimum), should be used (recommended), and
                                could be used (optional). HTAN and other
                                consortiums, including the Human Cell Atlas and
                                HuBMAP are working together to provide common
                                shared schemas.
                            </p>

                            <h2>Browse Standards</h2>

                            <ul>
                                <li>
                                    <Link href="/standard/clinical">
                                        Clinical
                                    </Link>
                                </li>
                                <li>
                                    <Link href="/standard/biospecimen">
                                        Biospecimen
                                    </Link>
                                </li>
                                <li>
                                    <Link href="/standard/sequencing">
                                        Sequencing
                                    </Link>
                                </li>
                                <li>
                                    <Link href="/standard/imaging">
                                        Imaging
                                    </Link>
                                </li>
                            </ul>
                        </div>
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
