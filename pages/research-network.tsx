import React from 'react';
import { Container, Row } from 'react-bootstrap';

import PageWrapper from '../components/PageWrapper';
import PreReleaseBanner from '../components/PreReleaseBanner';
import phase1Centers from '../data/phase1_centers.json';
import phase2Centers from '../data/phase2_centers.json';
import styles from './centercard.module.css';
import { HtaCenters } from '../types';

const Cards = (props: { data: HtaCenters }) => {
    return (
        <div className={styles.cardContainer}>
            {Object.entries(props.data).map(([centerId, htaCenter]) => (
                <a href={htaCenter.customURL || `/center/${centerId}`}>
                    <div className={styles.card} key={centerId}>
                        <img
                            src={`/${htaCenter.phase}/${centerId}.png`}
                            alt={centerId}
                        />
                        <div className={styles.text}>
                            <h2 className={styles.cardTitle}>
                                {htaCenter.title}
                            </h2>
                            <hr />
                            {htaCenter.principalInvestigators.map(
                                (pi, index) => (
                                    <p key={index}>{pi.name}</p>
                                )
                            )}
                        </div>
                    </div>
                </a>
            ))}
        </div>
    );
};

const ResearchNetwork = () => {
    return (
        <>
            <PreReleaseBanner />
            <PageWrapper>
                <Container>
                    <Row className={'contentWrapper'}>
                        <div className="col">
                            <h1>Research Network</h1>
                            <h2>Phase 2 Centers</h2>
                            <Cards data={phase2Centers} />

                            <h2>Phase 1 Centers</h2>
                            <Cards data={phase1Centers} />
                        </div>
                    </Row>
                </Container>
            </PageWrapper>
        </>
    );
};

export default ResearchNetwork;
