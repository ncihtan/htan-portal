import { GetStaticPaths, GetStaticProps } from 'next';

import HtaCenterPage, {
    HtaCenterPageProps,
} from '../../components/HtaCenterPage';
import PageWrapper from '../../components/PageWrapper';
import PreReleaseBanner from '../../components/PreReleaseBanner';
import htaData from '../../data/phase2_centers.json';
import { HtaCenters } from '../../types';

const HTAPage = (props: HtaCenterPageProps) => {
    return (
        <>
            <PreReleaseBanner />
            <PageWrapper>
                <HtaCenterPage {...props} />
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
    const hta = (htaData as HtaCenters)[params?.id as string];

    return { props: { hta } };
};

export default HTAPage;
