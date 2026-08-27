'use client';

import React, { useEffect, useState } from 'react';
import { Button, Col, Container, Row } from 'react-bootstrap';
import { ScaleLoader } from 'react-spinners';

import {
    caseQuery,
    caseQuery2,
    DEFAULT_CLICKHOUSE_DB,
    DEFAULT_PHASE2_CLICKHOUSE_DB,
    doQuery,
    getClientForDatabase,
    getPhase2Client,
} from '@htan/data-portal-commons';
import PageWrapper from '../components/PageWrapper';

const ExploreLanding = () => {
    const [phase1CaseCount, setPhase1CaseCount] = useState<number | null>(null);
    const [phase2CaseCount, setPhase2CaseCount] = useState<number | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchCaseCounts = async () => {
            try {
                // Fetch Phase 1 case count
                const phase1Client = getClientForDatabase(
                    DEFAULT_CLICKHOUSE_DB
                );
                const phase1Cases = await doQuery<any>(
                    caseQuery({ filterString: '' }),
                    phase1Client
                );
                setPhase1CaseCount(phase1Cases.length);

                // Fetch Phase 2 case count
                const phase2Client = getPhase2Client();
                const phase2Cases = await doQuery<any>(
                    caseQuery2({ filterString: '' }),
                    phase2Client
                );
                setPhase2CaseCount(phase2Cases.length);
            } catch (err) {
                console.error('Error fetching case counts:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchCaseCounts();
    }, []);

    const formatCaseCount = (count: number | null) => {
        if (count === null) return 'Loading...';
        return count.toLocaleString();
    };

    return (
        <PageWrapper>
            <Container
                style={{ paddingTop: 40, paddingBottom: 60, maxWidth: 900 }}
            >
                <h1>Explore HTAN Data</h1>
                <p style={{ fontSize: 18 }}>
                    The Human Tumor Atlas Network (HTAN) is a National Cancer
                    Institute&ndash;funded initiative that builds 3-dimensional
                    atlases of human cancers as they evolve from precancerous
                    lesions to advanced disease. HTAN data has been contributed
                    across two phases of the network. Because the two phases use
                    different data models, they are explored separately below.
                </p>

                <Row style={{ marginTop: 30 }}>
                    <Col md={6} style={{ marginBottom: 24 }}>
                        <h2>Phase 1 (2018&ndash;2024)</h2>
                        <p>
                            HTAN Phase 1 brought together ten research centers
                            and two pilot projects that built the network&apos;s
                            first tumor atlases. Its data model drew on existing
                            community standards, including the NCI Genomic Data
                            Commons, the Human Cell Atlas, the Human
                            Biomolecular Atlas Program (HuBMAP), and the Minimum
                            Information about Tissue Imaging (MITI) reporting
                            guidelines.
                        </p>
                        <p
                            style={{
                                marginBottom: 12,
                                fontSize: 14,
                                fontWeight: 500,
                            }}
                        >
                            {loading ? (
                                <ScaleLoader
                                    height={8}
                                    width={2}
                                    margin={2}
                                    color="#0066cc"
                                />
                            ) : (
                                `${formatCaseCount(phase1CaseCount)} cases`
                            )}
                        </p>
                        <Button
                            href="/explore/phase1"
                            variant="primary"
                            size="lg"
                        >
                            Explore Phase 1 Data
                        </Button>
                    </Col>
                    <Col md={6} style={{ marginBottom: 24 }}>
                        <h2>Phase 2 (2024&ndash;2029)</h2>
                        <p>
                            HTAN Phase 2 is the current phase of the network,
                            made up of ten research centers &mdash; five
                            building pre-cancer atlases and five building tumor
                            atlases &mdash; with a strong focus on spatial
                            profiling and single-cell RNA-Seq. Its data model
                            was updated to align with the NCI Cancer Research
                            Data Commons (CRDC), accommodate new assays, and
                            strengthen FAIR data sharing.
                        </p>
                        <p
                            style={{
                                marginBottom: 12,
                                fontSize: 14,
                                fontWeight: 500,
                            }}
                        >
                            {loading ? (
                                <ScaleLoader
                                    height={8}
                                    width={2}
                                    margin={2}
                                    color="#0066cc"
                                />
                            ) : (
                                `${formatCaseCount(phase2CaseCount)} cases`
                            )}
                        </p>
                        <Button
                            href="/explore/phase2"
                            variant="primary"
                            size="lg"
                        >
                            Explore Phase 2 Data
                        </Button>
                        <p
                            style={{
                                marginTop: 8,
                                fontSize: 12,
                                color: '#666',
                            }}
                        >
                            Does not include Phase 1 data
                        </p>
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
};

export default ExploreLanding;
