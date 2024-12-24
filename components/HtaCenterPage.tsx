import _ from 'lodash';
import { useEffect, useState } from 'react';
import { Container, Row } from 'react-bootstrap';

import { HtaCenter, PrincipalInvestigator } from '../types';
import styles from './HtaCenterPage.module.scss';

export interface HtaCenterPageProps {
    id: string;
    hta: HtaCenter;
    showGrantNumber?: boolean;
}

const HeaderLogos = (props: {
    imgSources: string[];
    headerImgClassname?: string;
}) => {
    return (
        <div className={styles.header}>
            {props.imgSources.map((src, index) => (
                <img
                    src={src}
                    key={index}
                    alt={src
                        .toLowerCase()
                        .split('.')[0]
                        .replace(/\//g, '')
                        .replace(/_/g, '-')}
                    className={props.headerImgClassname || styles.headerImg30}
                />
            ))}
        </div>
    );
};

const customHeaderContent: { [centerId: string]: JSX.Element } = {
    hta1: (
        <>
            <HeaderLogos
                imgSources={[
                    '/phase1/Broad-Inst-Logo.webp',
                    '/phase1/DFCI-Logo-with-Flag.webp',
                    '/phase1/HMS_Logo.webp',
                ]}
            />
            <br />
            <a href="https://humantumoratlas.org/htapp-webinar-series/">
                View the HTAPP Webinar Series
            </a>
        </>
    ),
    hta3: (
        <HeaderLogos
            imgSources={[
                '/phase1/BU-Logo.webp',
                '/phase1/Janseen-Logo.webp',
                '/phase1/UCLA-Logo.webp',
            ]}
        />
    ),
    hta4: (
        <HeaderLogos
            imgSources={[
                "/phase1/children's-hospital-of-philadelphia-logo.webp",
                '/phase1/university-of-pennsylvania-penn-vector-logo.webp',
            ]}
        />
    ),
    hta5: (
        <HeaderLogos
            imgSources={[
                '/phase1/DFCI-logo.webp',
                '/phase1/BroadInstLogoforDigitalRGB.webp',
            ]}
        />
    ),
    hta6: (
        <HeaderLogos
            imgSources={[
                '/phase1/Duke-SOM-logo.webp',
                '/phase1/ASU-full_logo.webp',
                '/phase1/Stanford-Logo.webp',
            ]}
        />
    ),
    hta7: (
        <HeaderLogos
            imgSources={['/phase1/HMS_Logo.webp', '/phase1/BWH-logo.webp']}
        />
    ),
    hta8: (
        <HeaderLogos
            imgSources={['/phase1/MSK_logo.webp']}
            headerImgClassname={styles.headerImg50}
        />
    ),
    hta9: (
        <HeaderLogos
            imgSources={['/phase1/OHSU_logo.webp']}
            headerImgClassname={styles.headerImg100}
        />
    ),
    hta10: (
        <HeaderLogos
            imgSources={['/phase1/Stanford-Logo.webp']}
            headerImgClassname={styles.headerImg100}
        />
    ),
    hta11: (
        <HeaderLogos
            imgSources={[
                '/phase1/VUMC-logo.webp',
                '/phase1/vanderbilt-university-logo.webp',
            ]}
        />
    ),
    hta12: (
        <HeaderLogos
            imgSources={['/phase1/WUSM-logo.webp']}
            headerImgClassname={styles.headerImg100}
        />
    ),
    'htan-dcc': (
        <HeaderLogos
            imgSources={[
                '/phase1/DFCI-Logo-with-Flag.webp',
                '/dcc/sage_bionetworks_logo.webp',
                '/phase1/MSK_logo.webp',
                '/dcc/isb_color_logo1.webp',
            ]}
            headerImgClassname={styles.headerImg20}
        />
    ),
};

const PrincipalInvestigators = (props: {
    principalInvestigators: PrincipalInvestigator[];
    phase: string;
}) => {
    const getImgSrc = (name: string, phase: string) => {
        return `/${phase}/${getKey(name)}.png`;
    };
    const getKey = (name: string) => {
        return name
            .toLowerCase()
            .split(',')[0]
            .replace(/\s/g, '_')
            .replace('à', 'a')
            .replace('é', 'e')
            .replace(/[.’]/g, '');
    };

    if (_.some(props.principalInvestigators, (pi) => pi.description?.length)) {
        // assuming if there is PI description there is also a PI image
        return (
            <>
                {props.principalInvestigators.map((pi) => (
                    <span key={getKey(pi.name)}>
                        <h3>
                            {pi.name} {pi.isContact && <>(Contact PI)</>} <br />{' '}
                            {pi.center}
                        </h3>
                        <p>
                            <img
                                alt={getKey(pi.name)}
                                className={styles.headshot}
                                src={getImgSrc(pi.name, props.phase)}
                            />
                            {pi.description}
                        </p>
                    </span>
                ))}
            </>
        );
    } else {
        // a simpler list without an image or description
        return (
            <ul>
                {props.principalInvestigators.map((pi) => (
                    <li key={getKey(pi.name)}>
                        {pi.name}, {pi.center}{' '}
                        {pi.isContact && <>(Contact PI)</>}
                    </li>
                ))}
            </ul>
        );
    }
};

const Overview = (props: { hta: HtaCenter; id: string }) => {
    const description = [...[props.hta.description]].flat();
    const [hasOverviewImg, setHasOverviewImg] = useState<boolean>(false);
    const imgSrc = `/${props.hta.phase}/${props.id}_overview.png`;

    // overview image may not exist for all centers
    // we need to hide the section in case no image found
    useEffect(() => {
        fetch(imgSrc)
            .then((response) => {
                if (response.status === 200) {
                    setHasOverviewImg(true);
                }
            })
            .catch(() => setHasOverviewImg(false));
    }, []);

    return (
        <>
            <h2>Overview</h2>
            {description.map((d, index) => (
                <p key={index}>{d}</p>
            ))}
            {hasOverviewImg && (
                <div className="text-center">
                    <img
                        className={styles.overviewImg}
                        src={imgSrc}
                        alt={`${props.id}_overview`}
                    />
                </div>
            )}
        </>
    );
};

const HtaCenterPage = ({ id, hta, showGrantNumber }: HtaCenterPageProps) => {
    if (!hta) {
        return <div>Loading...</div>;
    }

    return (
        <Container>
            <Row className={'contentWrapper'}>
                <div className="col">
                    <h1>{hta.title}</h1>
                    {customHeaderContent[id]}
                    {!_.isEmpty(hta.description) && (
                        <Overview hta={hta} id={id} />
                    )}
                    {showGrantNumber && hta.grantNumber && (
                        <p>
                            <b>Grant Number</b>: {hta.grantNumber}
                        </p>
                    )}
                    <h2>Principal Investigators</h2>
                    <PrincipalInvestigators
                        principalInvestigators={hta.principalInvestigators}
                        phase={hta.phase}
                    />
                </div>
            </Row>
        </Container>
    );
};

export default HtaCenterPage;
