import React from 'react';
import { Button, Col, Container, Row } from 'react-bootstrap';

import PageWrapper from '../components/PageWrapper';

const ExploreLanding = () => (
    <PageWrapper>
        <Container style={{ paddingTop: 40, paddingBottom: 60, maxWidth: 900 }}>
            <h1>Explore HTAN Data</h1>
            <p style={{ fontSize: 18 }}>
                The Human Tumor Atlas Network (HTAN) is a National Cancer
                Institute&ndash;funded Cancer Moonshot<sup>SM</sup> initiative
                that builds 3-dimensional atlases of human cancers as they
                evolve from precancerous lesions to advanced disease. HTAN data
                has been contributed across two phases of the network. Because
                the two phases use different data models, they are explored
                separately below.
            </p>

            <Row style={{ marginTop: 30 }}>
                <Col md={6} style={{ marginBottom: 24 }}>
                    <h2>Phase 1 (2018&ndash;2024)</h2>
                    <p>
                        HTAN Phase 1 brought together ten research centers and
                        two pilot projects that built the network&apos;s first
                        tumor atlases. Its data model drew on existing community
                        standards, including the NCI Genomic Data Commons, the
                        Human Cell Atlas, the Human Biomolecular Atlas Program
                        (HuBMAP), and the Minimum Information about Tissue
                        Imaging (MITI) reporting guidelines.
                    </p>
                    <Button href="/explore/phase1" variant="primary" size="lg">
                        Explore Phase 1 Data
                    </Button>
                </Col>
                <Col md={6} style={{ marginBottom: 24 }}>
                    <h2>Phase 2 (2024&ndash;present)</h2>
                    <p>
                        HTAN Phase 2 is the current phase of the network, made
                        up of ten research centers &mdash; five building
                        pre-cancer atlases and five building tumor atlases
                        &mdash; with a strong focus on spatial profiling and
                        single-cell RNA-Seq. Its data model was updated to align
                        with the NCI Cancer Research Data Commons (CRDC),
                        accommodate new assays, and strengthen FAIR data
                        sharing.
                    </p>
                    <Button href="/explore/phase2" variant="primary" size="lg">
                        Explore Phase 2 Data
                    </Button>
                </Col>
            </Row>

            <p style={{ marginTop: 20, fontSize: 14 }}>
                Because the Phase 1 and Phase 2 data models differ, the two
                phases may differ in the file formats, metadata values, and
                attributes collected. To learn more, see the{' '}
                <a
                    href="https://docs.humantumoratlas.org/"
                    target="_blank"
                    rel="noopener noreferrer"
                >
                    HTAN Manual
                </a>
                .
            </p>
        </Container>
    </PageWrapper>
);

export default ExploreLanding;
