import React from 'react';
import HtanNavbar from '../../components/HtanNavbar';
import Footer from '../../components/Footer';
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Breadcrumb from 'react-bootstrap/Breadcrumb';
import { GetServerSideProps, GetStaticProps } from 'next';
import { CmsData } from '../../types';
import { getStaticContent } from '../../ApiUtil';

export interface BiospecimenProps {
    data: CmsData[];
}

function Biospecimen(data: BiospecimenProps) {
    return (
        <>
            <HtanNavbar />
            <Container>
                <Row>
                    <Breadcrumb className="mt-3">
                        <Breadcrumb.Item href="/">Home</Breadcrumb.Item>
                        <Breadcrumb.Item href="/standards">
                            Data Standards
                        </Breadcrumb.Item>
                        <Breadcrumb.Item active>Biospecimen</Breadcrumb.Item>
                    </Breadcrumb>
                </Row>
                <Row>
                    <span
                        dangerouslySetInnerHTML={{
                            __html: data.data[0].content.rendered,
                        }}
                    ></span>
                </Row>
            </Container>
            <Footer />
        </>
    );
}

export const getStaticProps: GetStaticProps = async (context) => {
    const data = await getStaticContent(['data-standards-biospecimen-blurb']);
    return { props: { data } };
};

export default Biospecimen;
