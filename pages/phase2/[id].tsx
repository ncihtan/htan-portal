import _ from 'lodash';
import { GetStaticPaths, GetStaticProps } from 'next';
import { Container, Row } from 'react-bootstrap';

import PageWrapper from '../../components/PageWrapper';
import PreReleaseBanner from '../../components/PreReleaseBanner';
import htaData from '../../data/phase2_centers.json';
import { Phase2Center, Phase2Centers, PrincipalInvestigator } from './types';
import styles from './center.module.scss';

interface HTAProps {
    hta: Phase2Center;
}

const PrincipalInvestigators = (props: {
    principalInvestigators: PrincipalInvestigator[];
}) => {
    const getImgSrc = (name: string) => {
        return `/phase2/${getKey(name)}.jpg`;
    };
    const getKey = (name: string) => {
        return name.toLowerCase().split(',')[0].replace(/\s/g, '_');
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
                                src={getImgSrc(pi.name)}
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

const HTAPage = ({ hta }: HTAProps) => {
    if (!hta) {
        return <div>Loading...</div>;
    }

    return (
        <>
            <PreReleaseBanner />
            <PageWrapper>
                <Container>
                    <Row className={'contentWrapper'}>
                        <div className="col">
                            <h1>{hta.title}</h1>
                            <h2>Overview</h2>
                            <p>{hta.description}</p>
                            <p>
                                <b>Grant Number</b>: {hta.grantNumber}
                            </p>
                            <h2>Principal Investigators</h2>
                            <PrincipalInvestigators
                                principalInvestigators={
                                    hta.principalInvestigators
                                }
                            />
                        </div>
                    </Row>
                </Container>
            </PageWrapper>
        </>
    );
};

export const getStaticPaths: GetStaticPaths = async () => {
    const paths = Object.keys(htaData).map((id) => ({
        params: { id },
    }));

    return { paths, fallback: false };
};

export const getStaticProps: GetStaticProps = async ({ params }) => {
    const hta = (htaData as Phase2Centers)[params?.id as string];

    return { props: { hta } };
};

export default HTAPage;
