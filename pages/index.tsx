import React from 'react';
import fs from 'fs';
import process from 'process';
import path from 'path';

import PreReleaseBanner from '../components/PreReleaseBanner';
import HomePage, { IHomePropsProps } from '../components/HomePage';
import { GetStaticProps } from 'next';
import { WPConstants } from '../types';
import { getAtlasList, getContent, getStaticContent } from '../ApiUtil';
import PageWrapper from '../components/PageWrapper';
import {
    computeDashboardData,
    fillInEntities,
    LoadDataResult,
} from '../lib/helpers';

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

    const processedSynapseData = await fs.readFileSync(path.join(process.cwd(), 'public/processed_syn_data.json'), 'utf8')
    const files = fillInEntities(
        (JSON.parse(processedSynapseData) as any) as LoadDataResult
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
