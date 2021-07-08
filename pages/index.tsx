import React from 'react';
import synapseData from '../public/syn_data.json';

import PreReleaseBanner from '../components/PreReleaseBanner';
import HomePage, { IHomePropsProps } from '../components/HomePage';
import { GetStaticProps } from 'next';
import { WPConstants } from '../types';
import { getAtlasList, getContent, getStaticContent } from '../ApiUtil';
import PageWrapper from '../components/PageWrapper';
import { computeDashboardData, fillInEntities } from '../lib/helpers';
import { SynapseData } from '../lib/types';
import _ from 'lodash';
import { processSynapseJSON } from '../scripts/processSynapseJSON';

const Home = (data: IHomePropsProps) => {
    return (
        <>
            <PreReleaseBanner />
            <PageWrapper>
                <HomePage {...data} />
            </PageWrapper>
        </>
    );
};

export const getStaticProps: GetStaticProps = async (context) => {
    const data = await getStaticContent([WPConstants.HOMEPAGE_HERO_BLURB]);

    const homepageContent = data.find(
        (d: any) => d.slug === WPConstants.HOMEPAGE_HERO_BLURB
    );

    const atlases = await getAtlasList();

    const cards = await Promise.all([
        getContent('card-1', 'homepage'),
        getContent('card-2', 'homepage'),
        getContent('card-3', 'homepage'),
        getContent('card-4', 'homepage'),
        getContent('card-5', 'homepage'),
        getContent('card-6', 'homepage'),
    ]);

    const files = fillInEntities(
        processSynapseJSON((synapseData as unknown) as SynapseData, atlases)
    );

    return {
        props: {
            hero_blurb: homepageContent.content.rendered,
            cards: cards,
            atlases,
            synapseCounts: computeDashboardData(files),
        },
    };
};

export default Home;
