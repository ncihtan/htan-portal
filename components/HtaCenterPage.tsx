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
                    <Overview hta={hta} id={id} />
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
