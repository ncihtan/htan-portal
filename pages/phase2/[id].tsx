import { GetStaticPaths, GetStaticProps } from 'next';
import { useRouter } from 'next/router';
import htaData from './../../data/phase2_centers.json';
import { Phase2Center, Phase2Centers } from './types';
import PageWrapper from 'components/PageWrapper';
import PreReleaseBanner from './../../components/PreReleaseBanner';
import { Container, Row } from 'react-bootstrap';

interface HTAProps {
    hta: Phase2Center;
}

const HTAPage = ({ hta }: HTAProps) => {
    const router = useRouter();
    const { id } = router.query;

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
                            <p>
                                <b>Grant Number</b>: {hta.grantNumber}
                                <br />
                                <b>Principal Investigators:</b>
                                <ul>
                                    {hta.principalInvestigators.map(
                                        (pi, index) => (
                                            <li key={index}>{pi}</li>
                                        )
                                    )}
                                </ul>
                                {hta.description}
                            </p>
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
