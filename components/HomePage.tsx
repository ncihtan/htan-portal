import React, { useEffect, useState } from 'react';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import ButtonToolbar from 'react-bootstrap/ButtonToolbar';
import Button from 'react-bootstrap/Button';
import Container from 'react-bootstrap/Container';
import Jumbotron from 'react-bootstrap/Jumbotron';
import { WPAtlas } from '../types';
import styles from './homeStyles.module.scss';
import { EntityReport, getAtlasPageURL } from '../lib/helpers';
import { Helmet } from 'react-helmet';

export interface IHomePropsProps {
    hero_blurb: string;
    cards: any[];
    atlases: WPAtlas[];
    synapseCounts: EntityReport[];
}

function dashboardIcon(text: string, description: string) {
    return (
        <Col key={`icon-${description}`} xs lg="2">
            <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '60px', lineHeight: '70px' }}>
                    {text}
                </div>
                <div style={{ fontSize: '20px' }}>{description}</div>
            </div>
        </Col>
    );
}

const HomePage: React.FunctionComponent<IHomePropsProps> = ({
    hero_blurb,
    cards,
    synapseCounts,
    atlases,
}) => {
    return (
        <>
            <Helmet>
                <style>
                    {`#pageWrapper {
                   background: #eeeeee;
               } `}
                </style>
            </Helmet>
            <Jumbotron
                className={'text-center'}
                style={{ borderRadius: '0px', marginBottom: '0px' }}
            >
                <Row className="justify-content-md-center mt-5">
                    <Col md={{ span: 5 }} style={{ color: '#fff' }}>
                        <h1>The Gray PreCancer BRCA Atlas</h1>
                        <br />
                        <span>
                        Launched in September of 2020, the BRCA PreCancer Atlas
                        is a Gray Foundation-funded initiative through which a
                        collaborative network of research centers and a central
                        Data Coordinating Center is constructing a BRCA
                        PreCancer Atlas.
                        </span>
                        <br /><br />
                        <div
                            style={{
                                display: 'flex',
                                justifyContent: 'center',
                            }}
                        >
                            <ButtonToolbar>
                                <Button
                                    href="/explore"
                                    variant="primary"
                                    className="mr-4"
                                >
                                    Explore the Data
                                </Button>
                            </ButtonToolbar>
                        </div>
                    </Col>
                </Row>

                <Row className="justify-content-md-center mt-3"></Row>
            </Jumbotron>
            <Container
                fluid
                style={{
                    backgroundColor: '#eee',
                    paddingTop: '60px',
                    paddingBottom: '60px',
                }}
            >
                <Row className="justify-content-md-center">
                    {synapseCounts &&
                        synapseCounts.map((report: EntityReport) =>
                            dashboardIcon(report.text, report.description)
                        )}
                </Row>
            </Container>

            {/*<div className={styles.atlasCardContainer}>*/}
            {/*    {atlases.map((atlas) => {*/}
            {/*        let title = atlas.title.rendered.substr(0, 30);*/}
            {/*        if (title.length < atlas.title.rendered.length) {*/}
            {/*            title += '...';*/}
            {/*        }*/}

            {/*        return (*/}
            {/*            <div className={styles.atlasCard}>*/}
            {/*                <h4>*/}
            {/*                    <a href={getAtlasPageURL(atlas.htan_id)}>*/}
            {/*                        {title}*/}
            {/*                    </a>*/}
            {/*                </h4>*/}

            {/*                <div className={styles.imageHolder}>*/}
            {/*                    <img*/}
            {/*                        src={*/}
            {/*                            atlas.home_image.guid ||*/}
            {/*                            'https://humantumoratlas.org/wp-content/uploads/2020/04/example_1-1.jpg'*/}
            {/*                        }*/}
            {/*                    />*/}
            {/*                    <a*/}
            {/*                        className={'btn btn-primary'}*/}
            {/*                        href={getAtlasPageURL(atlas.htan_id)}*/}
            {/*                    >*/}
            {/*                        Explore*/}
            {/*                    </a>*/}
            {/*                </div>*/}

            {/*                <p className={styles.altasText}>*/}
            {/*                    {atlas.short_description ||*/}
            {/*                        "This is a short description of the Atlas. It shouldn't be more than a hundred words."}*/}
            {/*                </p>*/}
            {/*            </div>*/}
            {/*        );*/}
            {/*    })}*/}
            {/*</div>*/}
        </>
    );
};

export default HomePage;
