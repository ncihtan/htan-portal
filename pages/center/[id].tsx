import { GetStaticPaths, GetStaticProps } from 'next';

import HtaCenterPage, {
    HtaCenterPageProps,
} from '../../components/HtaCenterPage';
import PageWrapper from '../../components/PageWrapper';
import PreReleaseBanner from '../../components/PreReleaseBanner';
import centers from '../../data/research_network.json';
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
    const paths = Object.keys(centers).map((id) => ({
        params: { id },
    }));

    return { paths, fallback: false };
};

function getCenter(centers: HtaCenters, id?: string | string[]) {
    return (centers as HtaCenters)[id as string];
}

export const getStaticProps: GetStaticProps = async ({ params }) => {
    const hta = getCenter(centers as HtaCenters, params?.id);

    return { props: { hta, id: params?.id } };
};

export default HTAPage;
