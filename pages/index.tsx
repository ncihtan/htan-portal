import React from 'react';
import fs from 'fs';
import process from 'process';
import path from 'path';
import zlib from 'zlib';

import { config } from '@fortawesome/fontawesome-svg-core';
import '@fortawesome/fontawesome-svg-core/styles.css';
config.autoAddCss = false;

import PreReleaseBanner from '../components/PreReleaseBanner';
import HomePage, { IHomePropsProps } from '../components/HomePage';
import { GetStaticProps } from 'next';
import PageWrapper from '../components/PageWrapper';
import {
    computeDashboardData,
    fillInEntities,
    LoadDataResult,
} from '../lib/helpers';
import {
    computeEntityReportByAssay,
    computeEntityReportByOrgan,
} from '../lib/entityReportHelpers';

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
    const processedSynapseData = await zlib
        .gunzipSync(
            await fs.readFileSync(
                path.join(process.cwd(), 'public/processed_syn_data.json.gz')
            )
        )
        .toString();
    const files = fillInEntities(
        (JSON.parse(processedSynapseData) as any) as LoadDataResult
    );

    const blurb = `
    HTAN is a National Cancer Institute (NCI)-funded Cancer MoonshotSM initiative to construct 3-dimensional atlases of the dynamic cellular, morphological, and molecular features of human cancers as they evolve from precancerous lesions to advanced disease. (Cell April 2020)
    `;

    return {
        props: {
            hero_blurb: blurb,
            synapseCounts: computeDashboardData(files),
            organSummary: computeEntityReportByOrgan(files),
            assaySummary: computeEntityReportByAssay(files),
        },
    };
};

export default Home;
