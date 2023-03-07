import { GetStaticProps } from 'next';
import PreReleaseBanner from '../components/PreReleaseBanner';
import PageWrapper from '../components/PageWrapper';
import { getToolData, Tools } from '../lib/tools';
import ToolTable from '../components/ToolTable';

const ToolPage = (props: { tools: Tools }) => {
    return (
        <>
            <PreReleaseBanner />
            <PageWrapper>
                <div className={'pageWrapper explorePage'}>
                    <ToolTable tools={props.tools} />
                </div>
            </PageWrapper>
        </>
    );
};

export default ToolPage;

export const getStaticProps: GetStaticProps = async (context) => {
    const tools = getToolData();
    return { props: { tools } };
};
