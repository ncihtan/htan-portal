import React from 'react';
import { Container, Row } from 'react-bootstrap';

import PageWrapper from '../components/PageWrapper';
import PreReleaseBanner from '../components/PreReleaseBanner';
import htaPhase2Data from '../data/phase2_centers.json';
import styles from './centercard.module.css';
import { HtaCenters } from '../types';

const Cards = (props: { data: HtaCenters; phase: string }) => {
    return (
        <div className={styles.cardcontainer}>
            {Object.entries(props.data).map(([centerId, htaCenter]) => (
                <a href={`/center/${centerId}`}>
                    <div className={styles.card} key={centerId}>
                        <img
                            src={`/${props.phase}/${centerId}.png`}
                            alt={centerId}
                        />
                        <div className={styles.text}>
                            <h2>{htaCenter.title}</h2>
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
                            <Cards data={htaPhase2Data} phase="phase2" />

                            <h2>Phase 1 Centers</h2>
                            <div className="atlas-array">
                                <a href="/hta1">
                                    <img src="/HTA1_HTAPP-1.jpeg" alt="hta1" />
                                </a>
                                <a
                                    href="https://mcl.nci.nih.gov/"
                                    target="_blank"
                                >
                                    <img src="/hta2_PCAPP.jpeg" alt="hta2" />
                                </a>
                                <a href="/hta3">
                                    <img src="/HTA3_BU.jpeg" alt="hta3" />
                                </a>
                                <a href="/hta4">
                                    <img src="/HTA4_CHOP.jpeg" alt="hta4" />
                                </a>
                                <a href="/hta5">
                                    <img src="/HTA5_DFCI.jpeg" alt="hta5" />
                                </a>
                                <a href="/hta6">
                                    <img src="/HTA6_Duke-1.jpeg" alt="hta6" />
                                </a>
                                <a href="/hta7">
                                    <img src="/HTA7_HMS.jpeg" alt="hta7" />
                                </a>
                                <a href="/hta8">
                                    <img src="/HTA8_MSKCC.jpeg" alt="hta8" />
                                </a>
                                <a href="/hta9">
                                    <img
                                        src="/HTAN_OHSU_Research_Card_Update_1_.jpeg"
                                        alt="hta9"
                                    />
                                </a>
                                <a href="/hta10">
                                    <img
                                        src="/HTA10_Stanford-1.jpeg"
                                        alt="hta10"
                                    />
                                </a>
                                <a href="/hta11">
                                    <img src="/HTA11_VUMC.jpeg" alt="hta11" />
                                </a>
                                <a href="/hta12">
                                    <img
                                        src="/HTA12_Wash-U-1.jpeg"
                                        alt="hta12"
                                    />
                                </a>
                            </div>
                        </div>
                    </Row>
                </Container>
            </PageWrapper>
        </>
    );
};

export default ResearchNetwork;
