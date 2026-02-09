import React from 'react';
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Alert from 'react-bootstrap/Alert';
import PreReleaseBanner from '../components/PreReleaseBanner';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faExternalLinkAlt } from '@fortawesome/free-solid-svg-icons';

import PageWrapper from '../components/PageWrapper';

const Transfer = () => {
    return (
        <>
            <PreReleaseBanner />
            <PageWrapper>
                <Container>
                    <Row className={'contentWrapper'}>
                        <h1>Data Transfer</h1>
                        <Alert variant={'info'}>
                            <strong>For HTAN Phase 2 Data Submitters:</strong>{' '}
                            If you are submitting new data for HTAN Phase 2,
                            please refer to the{' '}
                            <a
                                href="https://htan2-data-model.readthedocs.io/en/main/index.html"
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                HTAN Phase 2 Data Model{' '}
                                <FontAwesomeIcon icon={faExternalLinkAlt} />
                            </a>
                            .
                        </Alert>
                        <p>
                            We currently only accept data submissions of{' '}
                            <a href="/research-network">
                                atlas teams that are part of HTAN
                            </a>
                            . If you would like to submit data, please see the{' '}
                            <a
                                href="https://docs.humantumoratlas.org/data_submission/overview/"
                                target="_blank"
                            >
                                HTAN Manual Data Submission Overview
                            </a>
                            .
                        </p>
                    </Row>
                </Container>
            </PageWrapper>
        </>
    );
};

export default Transfer;
