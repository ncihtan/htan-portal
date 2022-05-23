import React from 'react';
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import PreReleaseBanner from '../../components/PreReleaseBanner';
import { GetStaticProps } from 'next';
import { Publication } from '../../types';
import PageWrapper from '../../components/PageWrapper';
import { Nav, Tab } from 'react-bootstrap';
import {
    getAllPublicationIds,
    getPublicationData,
} from '../../lib/publications';

const PublicationPage = (publication: Publication) => {
    console.log(publication);

    return (
        <>
            <PreReleaseBanner />
            <PageWrapper>
                <Container>
                    <Row>
                        <h2>{publication.data.publicationData.title}</h2>
                        <p>
                            {publication.data.publicationData.description}
                            <br />
                            Pubmed:{' '}
                            <a href="https://pubmed.ncbi.nlm.nih.gov/35243422/">
                                35243422
                            </a>
                        </p>
                    </Row>
                    <Row>
                        <Tab.Container defaultActiveKey="abstract">
                            <Nav variant="tabs" fill>
                                <Nav.Item>
                                    <Nav.Link eventKey="abstract">
                                        Abstract
                                    </Nav.Link>
                                </Nav.Item>
                                <Nav.Item>
                                    <Nav.Link eventKey="datasets">
                                        Datasets
                                    </Nav.Link>
                                </Nav.Item>
                                <Nav.Item>
                                    <Nav.Link eventKey="participants">
                                        Participants
                                    </Nav.Link>
                                </Nav.Item>
                                <Nav.Item>
                                    <Nav.Link eventKey="biospecimens">
                                        Biospecimens
                                    </Nav.Link>
                                </Nav.Item>
                                <Nav.Item>
                                    <Nav.Link eventKey="imagingData">
                                        Imaging Data
                                    </Nav.Link>
                                </Nav.Item>
                                <Nav.Item>
                                    <Nav.Link eventKey="sequencing">
                                        Sequencing
                                    </Nav.Link>
                                </Nav.Item>
                                <Nav.Item>
                                    <Nav.Link eventKey="tools">Tools</Nav.Link>
                                </Nav.Item>
                            </Nav>

                            <Tab.Content>
                                <Tab.Pane eventKey="abstract">
                                    <Container className="mt-3">
                                        Mechanisms of therapeutic resistance and
                                        vulnerability evolve in metastatic
                                        cancers as tumor cells and extrinsic
                                        microenvironmental influences change
                                        during treatment. To support the
                                        development of methods for identifying
                                        these mechanisms in individual people,
                                        here we present an omic and
                                        multidimensional spatial (OMS) atlas
                                        generated from four serial biopsies of
                                        an individual with metastatic breast
                                        cancer during 3.5 years of therapy. This
                                        resource links detailed, longitudinal
                                        clinical metadata that includes
                                        treatment times and doses, anatomic
                                        imaging, and blood-based response
                                        measurements to clinical and exploratory
                                        analyses, which includes comprehensive
                                        DNA, RNA, and protein profiles; images
                                        of multiplexed immunostaining; and 2-
                                        and 3-dimensional scanning electron
                                        micrographs. These data report aspects
                                        of heterogeneity and evolution of the
                                        cancer genome, signaling pathways,
                                        immune microenvironment, cellular
                                        composition and organization, and
                                        ultrastructure. We present illustrative
                                        examples of how integrative analyses of
                                        these data reveal potential mechanisms
                                        of response and resistance and suggest
                                        novel therapeutic vulnerabilities.
                                    </Container>
                                </Tab.Pane>
                                <Tab.Pane eventKey="datasets">
                                    <Container className="mt-3">
                                        Mechanisms of therapeutic resistance and
                                        vulnerability evolve in metastatic
                                        cancers as tumor cells and extrinsic
                                        microenvironmental influences change
                                        during treatment. To support the
                                        development of methods for identifying
                                        these mechanisms in individual people,
                                        here we present an omic and
                                        multidimensional spatial (OMS) atlas
                                        generated from four serial biopsies of
                                        an individual with metastatic breast
                                        cancer during 3.5 years of therapy. This
                                        resource links detailed, longitudinal
                                        clinical metadata that includes
                                        treatment times and doses, anatomic
                                        imaging, and blood-based response
                                        measurements to clinical and exploratory
                                        analyses, which includes comprehensive
                                        DNA, RNA, and protein profiles; images
                                        of multiplexed immunostaining; and 2-
                                        and 3-dimensional scanning electron
                                        micrographs. These data report aspects
                                        of heterogeneity and evolution of the
                                        cancer genome, signaling pathways,
                                        immune microenvironment, cellular
                                        composition and organization, and
                                        ultrastructure. We present illustrative
                                        examples of how integrative analyses of
                                        these data reveal potential mechanisms
                                        of response and resistance and suggest
                                        novel therapeutic vulnerabilities.
                                    </Container>
                                </Tab.Pane>
                                <Tab.Pane eventKey="participants">
                                    <Container className="mt-3">
                                        Mechanisms of therapeutic resistance and
                                        vulnerability evolve in metastatic
                                        cancers as tumor cells and extrinsic
                                        microenvironmental influences change
                                        during treatment. To support the
                                        development of methods for identifying
                                        these mechanisms in individual people,
                                        here we present an omic and
                                        multidimensional spatial (OMS) atlas
                                        generated from four serial biopsies of
                                        an individual with metastatic breast
                                        cancer during 3.5 years of therapy. This
                                        resource links detailed, longitudinal
                                        clinical metadata that includes
                                        treatment times and doses, anatomic
                                        imaging, and blood-based response
                                        measurements to clinical and exploratory
                                        analyses, which includes comprehensive
                                        DNA, RNA, and protein profiles; images
                                        of multiplexed immunostaining; and 2-
                                        and 3-dimensional scanning electron
                                        micrographs. These data report aspects
                                        of heterogeneity and evolution of the
                                        cancer genome, signaling pathways,
                                        immune microenvironment, cellular
                                        composition and organization, and
                                        ultrastructure. We present illustrative
                                        examples of how integrative analyses of
                                        these data reveal potential mechanisms
                                        of response and resistance and suggest
                                        novel therapeutic vulnerabilities.
                                    </Container>
                                </Tab.Pane>
                                <Tab.Pane eventKey="biospecimens">
                                    <Container className="mt-3">
                                        Mechanisms of therapeutic resistance and
                                        vulnerability evolve in metastatic
                                        cancers as tumor cells and extrinsic
                                        microenvironmental influences change
                                        during treatment. To support the
                                        development of methods for identifying
                                        these mechanisms in individual people,
                                        here we present an omic and
                                        multidimensional spatial (OMS) atlas
                                        generated from four serial biopsies of
                                        an individual with metastatic breast
                                        cancer during 3.5 years of therapy. This
                                        resource links detailed, longitudinal
                                        clinical metadata that includes
                                        treatment times and doses, anatomic
                                        imaging, and blood-based response
                                        measurements to clinical and exploratory
                                        analyses, which includes comprehensive
                                        DNA, RNA, and protein profiles; images
                                        of multiplexed immunostaining; and 2-
                                        and 3-dimensional scanning electron
                                        micrographs. These data report aspects
                                        of heterogeneity and evolution of the
                                        cancer genome, signaling pathways,
                                        immune microenvironment, cellular
                                        composition and organization, and
                                        ultrastructure. We present illustrative
                                        examples of how integrative analyses of
                                        these data reveal potential mechanisms
                                        of response and resistance and suggest
                                        novel therapeutic vulnerabilities.
                                    </Container>
                                </Tab.Pane>
                                <Tab.Pane eventKey="imagingData">
                                    <Container className="mt-3">
                                        Mechanisms of therapeutic resistance and
                                        vulnerability evolve in metastatic
                                        cancers as tumor cells and extrinsic
                                        microenvironmental influences change
                                        during treatment. To support the
                                        development of methods for identifying
                                        these mechanisms in individual people,
                                        here we present an omic and
                                        multidimensional spatial (OMS) atlas
                                        generated from four serial biopsies of
                                        an individual with metastatic breast
                                        cancer during 3.5 years of therapy. This
                                        resource links detailed, longitudinal
                                        clinical metadata that includes
                                        treatment times and doses, anatomic
                                        imaging, and blood-based response
                                        measurements to clinical and exploratory
                                        analyses, which includes comprehensive
                                        DNA, RNA, and protein profiles; images
                                        of multiplexed immunostaining; and 2-
                                        and 3-dimensional scanning electron
                                        micrographs. These data report aspects
                                        of heterogeneity and evolution of the
                                        cancer genome, signaling pathways,
                                        immune microenvironment, cellular
                                        composition and organization, and
                                        ultrastructure. We present illustrative
                                        examples of how integrative analyses of
                                        these data reveal potential mechanisms
                                        of response and resistance and suggest
                                        novel therapeutic vulnerabilities.
                                    </Container>
                                </Tab.Pane>
                                <Tab.Pane eventKey="sequencing">
                                    <Container className="mt-3">
                                        Mechanisms of therapeutic resistance and
                                        vulnerability evolve in metastatic
                                        cancers as tumor cells and extrinsic
                                        microenvironmental influences change
                                        during treatment. To support the
                                        development of methods for identifying
                                        these mechanisms in individual people,
                                        here we present an omic and
                                        multidimensional spatial (OMS) atlas
                                        generated from four serial biopsies of
                                        an individual with metastatic breast
                                        cancer during 3.5 years of therapy. This
                                        resource links detailed, longitudinal
                                        clinical metadata that includes
                                        treatment times and doses, anatomic
                                        imaging, and blood-based response
                                        measurements to clinical and exploratory
                                        analyses, which includes comprehensive
                                        DNA, RNA, and protein profiles; images
                                        of multiplexed immunostaining; and 2-
                                        and 3-dimensional scanning electron
                                        micrographs. These data report aspects
                                        of heterogeneity and evolution of the
                                        cancer genome, signaling pathways,
                                        immune microenvironment, cellular
                                        composition and organization, and
                                        ultrastructure. We present illustrative
                                        examples of how integrative analyses of
                                        these data reveal potential mechanisms
                                        of response and resistance and suggest
                                        novel therapeutic vulnerabilities.
                                    </Container>
                                </Tab.Pane>
                                <Tab.Pane eventKey="tools">
                                    <Container className="mt-3">
                                        Mechanisms of therapeutic resistance and
                                        vulnerability evolve in metastatic
                                        cancers as tumor cells and extrinsic
                                        microenvironmental influences change
                                        during treatment. To support the
                                        development of methods for identifying
                                        these mechanisms in individual people,
                                        here we present an omic and
                                        multidimensional spatial (OMS) atlas
                                        generated from four serial biopsies of
                                        an individual with metastatic breast
                                        cancer during 3.5 years of therapy. This
                                        resource links detailed, longitudinal
                                        clinical metadata that includes
                                        treatment times and doses, anatomic
                                        imaging, and blood-based response
                                        measurements to clinical and exploratory
                                        analyses, which includes comprehensive
                                        DNA, RNA, and protein profiles; images
                                        of multiplexed immunostaining; and 2-
                                        and 3-dimensional scanning electron
                                        micrographs. These data report aspects
                                        of heterogeneity and evolution of the
                                        cancer genome, signaling pathways,
                                        immune microenvironment, cellular
                                        composition and organization, and
                                        ultrastructure. We present illustrative
                                        examples of how integrative analyses of
                                        these data reveal potential mechanisms
                                        of response and resistance and suggest
                                        novel therapeutic vulnerabilities.
                                    </Container>
                                </Tab.Pane>
                            </Tab.Content>
                        </Tab.Container>
                    </Row>
                </Container>
            </PageWrapper>
        </>
    );
};

export default PublicationPage;

export const getStaticProps: GetStaticProps = async (context) => {
    // @ts-ignore
    const data = await getPublicationData(context.params.id);
    return { props: { data } };
};

export async function getStaticPaths() {
    const paths = getAllPublicationIds();
    return {
        paths,
        fallback: false,
    };
}
