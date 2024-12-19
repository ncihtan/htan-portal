import { GetStaticPaths, GetStaticProps } from 'next';

import HtaCenterPage, {
    HtaCenterPageProps,
} from '../../components/HtaCenterPage';
import PageWrapper from '../../components/PageWrapper';
import PreReleaseBanner from '../../components/PreReleaseBanner';
import phase1Centers from '../../data/phase1_centers.json';
import phase2Centers from '../../data/phase2_centers.json';
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
    const paths = [
        ...Object.keys(phase1Centers),
        ...Object.keys(phase2Centers),
    ].map((id) => ({
        params: { id },
    }));

    return { paths, fallback: false };
};

function getCenter(centers: HtaCenters, id?: string | string[]) {
    return (centers as HtaCenters)[id as string];
}

export const getStaticProps: GetStaticProps = async ({ params }) => {
    const hta =
        getCenter(phase1Centers, params?.id) ||
        getCenter(phase2Centers, params?.id);

    return { props: { hta } };
};

export default HTAPage;
