import React from 'react';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import ButtonToolbar from 'react-bootstrap/ButtonToolbar';
import Button from 'react-bootstrap/Button';
import Container from 'react-bootstrap/Container';
import Jumbotron from 'react-bootstrap/Jumbotron';
import { EntityReport } from '../lib/helpers';
import Plots from './Plots';
import {
    EntityReportByAttribute,
    NOT_REPORTED,
} from '@htan/data-portal-commons';

export interface IHomePropsProps {
    synapseCounts: EntityReport[];
    phase2SynapseCounts: EntityReport[];
    organSummary: EntityReportByAttribute[];
    phase2OrganSummary: EntityReportByAttribute[];
    assaySummary: EntityReportByAttribute[];
    phase2AssaySummary: EntityReportByAttribute[];
}

function mergeEntityReportByAttribute(
    phase1Summary: EntityReportByAttribute[],
    phase2Summary: EntityReportByAttribute[]
): EntityReportByAttribute[] {
    const mergedByAttributeValue = new Map<string, EntityReportByAttribute>();

    [...phase1Summary, ...phase2Summary].forEach((report) => {
        const key = report.attributeValue ?? '';
        const existing = mergedByAttributeValue.get(key);

        if (!existing) {
            mergedByAttributeValue.set(key, {
                ...report,
                attributeFilterValues: [...report.attributeFilterValues],
                distributionByCenter: report.distributionByCenter.map((d) => ({
                    ...d,
                    attributeFilterValues: [...d.attributeFilterValues],
                })),
            });
            return;
        }

        const mergedDistributionByCenter = new Map(
            existing.distributionByCenter.map((distribution) => [
                distribution.center,
                {
                    ...distribution,
                    attributeFilterValues: [
                        ...distribution.attributeFilterValues,
                    ],
                },
            ])
        );

        report.distributionByCenter.forEach((distribution) => {
            const existingDistribution = mergedDistributionByCenter.get(
                distribution.center
            );
            if (!existingDistribution) {
                mergedDistributionByCenter.set(distribution.center, {
                    ...distribution,
                    attributeFilterValues: [
                        ...distribution.attributeFilterValues,
                    ],
                });
                return;
            }

            existingDistribution.totalCount += distribution.totalCount;
            existingDistribution.attributeFilterValues = Array.from(
                new Set([
                    ...existingDistribution.attributeFilterValues,
                    ...distribution.attributeFilterValues,
                ])
            );
        });

        existing.totalCount += report.totalCount;
        existing.attributeFilterValues = Array.from(
            new Set([
                ...existing.attributeFilterValues,
                ...report.attributeFilterValues,
            ])
        );
        existing.distributionByCenter = Array.from(
            mergedDistributionByCenter.values()
        );
    });

    return Array.from(mergedByAttributeValue.values());
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
    synapseCounts,
    phase2SynapseCounts,
    organSummary,
    phase2OrganSummary,
    assaySummary,
    phase2AssaySummary,
}) => {
    const combinedSynapseCounts = React.useMemo(() => {
        const phase1ByDescription = new Map(
            synapseCounts.map((count) => [count.description, count])
        );
        const phase2ByDescription = new Map(
            phase2SynapseCounts.map((count) => [count.description, count])
        );
        const organNames = new Set([
            ...organSummary
                .map((item) => item.attributeValue)
                .filter((value) => value !== NOT_REPORTED),
            ...phase2OrganSummary
                .map((item) => item.attributeValue)
                .filter((value) => value !== NOT_REPORTED),
        ]);
        const descriptions = Array.from(
            new Set([
                ...synapseCounts.map((count) => count.description),
                ...phase2SynapseCounts.map((count) => count.description),
            ])
        );

        return descriptions.map((description) => {
            const phase1Count = parseInt(
                phase1ByDescription.get(description)?.text ?? '0',
                10
            );
            const phase2Count = parseInt(
                phase2ByDescription.get(description)?.text ?? '0',
                10
            );
            if (description === 'Organs') {
                return {
                    description,
                    text: String(organNames.size),
                };
            }
            return {
                description,
                text: String(phase1Count + phase2Count),
            };
        });
    }, [phase2SynapseCounts, phase2OrganSummary, organSummary, synapseCounts]);

    const combinedOrganSummary = React.useMemo(
        () => mergeEntityReportByAttribute(organSummary, phase2OrganSummary),
        [organSummary, phase2OrganSummary]
    );

    const combinedAssaySummary = React.useMemo(
        () => mergeEntityReportByAttribute(assaySummary, phase2AssaySummary),
        [assaySummary, phase2AssaySummary]
    );

    const renderSummaryRow = (counts: EntityReport[]) => (
        <Row className="justify-content-md-center">
            {counts &&
                counts.map((report: EntityReport) =>
                    dashboardIcon(report.text, report.description)
                )}
        </Row>
    );

    return (
        <>
            <Jumbotron
                className={'text-center position-relative'}
                style={{ borderRadius: '0px', marginBottom: '0px' }}
            >
                <div
                    className={'position-absolute'}
                    style={{
                        bottom: 10,
                        right: 10,
                        color: '#fff',
                    }}
                >
                    <a style={{ color: 'white' }} href="/data-updates">
                        Data Release V8.0 (Last updated 2026-08-03)
                    </a>
                </div>
                <Row className="justify-content-md-center">
                    <Col
                        md={{ span: 5 }}
                        style={{
                            color: '#fff',
                            backgroundColor: 'rgba(0,0,0,0.5)',
                            borderRadius: 25,
                            padding: 20,
                        }}
                    >
                        <h1 style={{ fontSize: 40, color: '#24cad5' }}>
                            Human Tumor Atlas Network
                        </h1>
                        <br />

                        <p style={{ fontSize: 20 }}>
                            HTAN is a National Cancer Institute (NCI)-funded
                            initiative to construct 3-dimensional atlases of the
                            dynamic cellular, morphological, and molecular
                            features of human cancers as they evolve from
                            precancerous lesions to advanced disease.
                        </p>

                        <div
                            style={{
                                display: 'flex',
                                paddingTop: 10,
                                justifyContent: 'center',
                            }}
                        >
                            <ButtonToolbar>
                                <Button
                                    href="/explore"
                                    variant="primary"
                                    className="mr-4"
                                    size="lg"
                                >
                                    Explore Data
                                </Button>
                                <Button
                                    href="/overview"
                                    variant="primary"
                                    className="mr-4"
                                    size="lg"
                                >
                                    Learn more
                                </Button>
                                <Button
                                    href="https://docs.humantumoratlas.org/data_access/citing_htan/"
                                    variant="primary"
                                    className="mr-4"
                                    size="lg"
                                    target="_blank"
                                >
                                    Citing HTAN
                                </Button>
                            </ButtonToolbar>
                        </div>
                    </Col>
                </Row>
            </Jumbotron>
            <Container
                fluid
                style={{
                    backgroundColor: '#eee',
                    paddingTop: '20px',
                    paddingBottom: '20px',
                }}
            >
                {renderSummaryRow(combinedSynapseCounts)}
            </Container>
            {/* <Container
                fluid
                style={{
                    backgroundColor: '#ddd',
                    color: 'black',
                    padding: '5px',
                }}
            >
                <Row className="justify-content-md-center">
                    <span>About this Release:</span>
                </Row>
            </Container> */}
            <Plots
                organSummary={combinedOrganSummary}
                assaySummary={combinedAssaySummary}
                footerContent={
                    <p style={{ fontSize: 'medium' }}>
                        Many more profiled tumors will be available in the
                        future. Stay tuned!
                    </p>
                }
            />

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
