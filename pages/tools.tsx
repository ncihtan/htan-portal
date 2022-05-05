import React from 'react';
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Breadcrumb from 'react-bootstrap/Breadcrumb';
import HtanNavbar from '../components/HtanNavbar';
import PreReleaseBanner from '../components/PreReleaseBanner';
import Footer from '../components/Footer';
import { GetServerSideProps, GetStaticProps } from 'next';
import { CmsData } from '../types';
import { getStaticContent } from '../ApiUtil';
import PageWrapper from '../components/PageWrapper';

export interface ToolsProps {
    data: CmsData[];
}

const Tools = (data: ToolsProps) => {
    return (
        <>
            <PageWrapper>
                <Container>
                    <Row>
                        <Breadcrumb>
                            <Breadcrumb.Item href="/">Home</Breadcrumb.Item>
                            <Breadcrumb.Item active>
                                Analysis Tools
                            </Breadcrumb.Item>
                        </Breadcrumb>
                    </Row>
                    <Row>
                        <h1>Analysis Tools</h1>
                    </Row>
                    <Row className="mt-3">
                        <span
                            dangerouslySetInnerHTML={{
                                __html: data.data[0].content.rendered,
                            }}
                        />
                    </Row>
                </Container>
            </PageWrapper>
        </>
    );
};

export const getStaticProps: GetStaticProps = async (context) => {
    const data = await getStaticContent(['summary-blurb-analysis-tools']);
    return { props: { data } };
};

export default Tools;
