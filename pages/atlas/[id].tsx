import { NextRouter, useRouter } from 'next/router';
import HtanNavbar from '../../components/HtanNavbar';
import Footer from '../../components/Footer';
import getData from '../../lib/getData';
import { getAtlasList } from '../../ApiUtil';
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Breadcrumb from 'react-bootstrap/Breadcrumb';
import Tab from 'react-bootstrap/Tab';
import Nav from 'react-bootstrap/Nav';
import React from 'react';
import Head from 'next/dist/next-server/lib/head';
import { Category, SynapseAtlas, SynapseData, WPAtlas } from '../../types';
import { GetStaticProps } from 'next';
import { Button } from 'react-bootstrap';
import { getExplorePageURL } from '../../lib/helpers';
import { PropNames } from '../../lib/types';

const data = getData();

export type AtlasURLQuery = {
    fromApp: string | undefined;
};

interface IPostProps {
    synapseData: SynapseData;
    WPAtlasData: WPAtlas[];
    router: NextRouter;
}

const PostContent: React.FunctionComponent<{
    wpAtlas: WPAtlas;
    router: NextRouter;
    synapseAtlas?: SynapseAtlas;
}> = ({ wpAtlas, router, synapseAtlas }) => {
    let mergedClinicalAndBiospecimenData: Category;
    if (synapseAtlas) {
        mergedClinicalAndBiospecimenData = Object.assign(
            {},
            synapseAtlas.clinical,
            synapseAtlas.biospecimen
        );
    }

    return (
        <Container>
            <Row>
                <Breadcrumb
                    className="mt-3"
                    listProps={{ style: { marginBottom: 0, paddingBottom: 4 } }}
                >
                    <Breadcrumb.Item href="/">Home</Breadcrumb.Item>
                    <Breadcrumb.Item href="/explore">Explore</Breadcrumb.Item>
                    <Breadcrumb.Item active>
                        {wpAtlas ? wpAtlas.title.rendered : ''}
                    </Breadcrumb.Item>
                </Breadcrumb>
            </Row>

            <Row style={{ marginBottom: 20 }}>
                {router.query.fromApp === 'true' && (
                    <Button
                        variant={'link'}
                        size={'sm'}
                        style={{ fontSize: 12 }}
                        onClick={() => router.back()}
                    >
                        {'< Back'}
                    </Button>
                )}
                <Button
                    variant={'link'}
                    size={'sm'}
                    style={{ fontSize: 12 }}
                    onClick={() =>
                        router.push(
                            getExplorePageURL([
                                {
                                    value: wpAtlas.title.rendered,
                                    group: PropNames.AtlasName,
                                },
                            ])
                        )
                    }
                >
                    View Files
                </Button>
            </Row>

            <Row>
                <Tab.Container defaultActiveKey="atlasOverview">
                    <Nav variant="tabs" fill>
                        <Nav.Item>
                            <Nav.Link eventKey="atlasOverview">
                                Atlas Overview
                            </Nav.Link>
                        </Nav.Item>
                        <Nav.Item>
                            <Nav.Link eventKey="dataOverview">
                                Data Overview
                            </Nav.Link>
                        </Nav.Item>
                        <Nav.Item>
                            <Nav.Link eventKey="publications">
                                Publications
                            </Nav.Link>
                        </Nav.Item>
                    </Nav>

                    <Tab.Content>
                        <Tab.Pane eventKey="atlasOverview">
                            <Container className="mt-3">
                                {wpAtlas ? (
                                    <span
                                        dangerouslySetInnerHTML={{
                                            __html: wpAtlas.atlas_overview,
                                        }}
                                    />
                                ) : (
                                    'Loading...'
                                )}
                            </Container>
                        </Tab.Pane>
                        <Tab.Pane eventKey="dataOverview">
                            <Container className="mt-3">
                                {wpAtlas ? (
                                    <span
                                        dangerouslySetInnerHTML={{
                                            __html: wpAtlas.data_overview,
                                        }}
                                    />
                                ) : (
                                    'Loading...'
                                )}
                            </Container>
                        </Tab.Pane>
                        <Tab.Pane eventKey="publications">
                            <Container className="mt-3">
                                {wpAtlas ? (
                                    <span
                                        dangerouslySetInnerHTML={{
                                            __html: wpAtlas.publications,
                                        }}
                                    />
                                ) : (
                                    'Loading...'
                                )}
                            </Container>
                        </Tab.Pane>
                    </Tab.Content>
                </Tab.Container>
            </Row>
        </Container>
    );
};

const Post: React.FunctionComponent<IPostProps> = ({
    synapseData,
    WPAtlasData,
}) => {
    const router = useRouter();
    const htan_id = router.query.id as string;

    const postData = WPAtlasData.find((a) => {
        return a.htan_id === htan_id;
    });

    //console.log(htan_id);

    const synapseAtlas: SynapseAtlas | undefined =
        postData && (synapseData[htan_id.toUpperCase()] as SynapseAtlas);

    const content = postData ? (
        <PostContent
            wpAtlas={postData}
            router={router}
            synapseAtlas={synapseAtlas}
        />
    ) : (
        <div>There is Atlas corresponding to this ID</div>
    );

    return (
        <>
            <Head>
                <script src="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.13.0/js/all.min.js"></script>
            </Head>
            <HtanNavbar />
            <div id={'iframe-wrapper'}></div>
            {postData && synapseAtlas === undefined && (
                <div className={'alert alert-danger'}>
                    No synapse data corresponding to ID "{postData.synapse_id}"
                </div>
            )}
            {content}
            <Footer />
        </>
    );
};

export default Post;

export const getStaticProps: GetStaticProps = async (context) => {
    const WPAtlasData = await getAtlasList();
    const synapseData = getData();

    return {
        props: {
            WPAtlasData,
            synapseData,
        },
    };
};

export async function getStaticPaths() {
    const atlases = await getAtlasList();

    const paths = atlases.map((a) => `/atlas/${a.htan_id}`);

    return { paths, fallback: false };
}
