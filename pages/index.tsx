import React from 'react';
import _ from 'lodash';

import {
    caseQuery2,
    doQuery,
    getPhase2Client,
    NOT_REPORTED,
} from '@htan/data-portal-commons';

import PreReleaseBanner from '../components/PreReleaseBanner';
import HomePage, { IHomePropsProps } from '../components/HomePage';
import { GetStaticProps } from 'next';
import PageWrapper from '../components/PageWrapper';

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
    const phase2Client = getPhase2Client();

    const assayCounts = await doQuery<{
        assayName: string;
        atlas_name: string;
        count: string;
    }>(
        `
        SELECT
            assayName,
            atlas_name,
            COUNT(distinct demographicsIds) AS count
        FROM files
        ARRAY JOIN demographicsIds
        GROUP BY
            assayName, atlas_name
    `,
        phase2Client
    );

    const organCounts = await doQuery<{
        organType: string;
        atlas_name: string;
        count: string;
    }>(
        `
        SELECT 
            TISSUE_OR_ORGAN_OF_ORIGIN_UBERON_NAME as organType,
            atlas_name, 
            count(DISTINCT demographicsIds) as count 
        FROM files
        ARRAY JOIN TISSUE_OR_ORGAN_OF_ORIGIN_UBERON_NAME
        GROUP BY 
            organType, atlas_name
    `,
        phase2Client
    );

    const entityCounts = await doQuery<{
        atlasCount: string;
        caseCount: string;
        sampleCount: string;
        organCount: string;
    }>(
        `
        SELECT (SELECT count(*) FROM atlases) as atlasCount,
        (SELECT count(*) FROM (
            ${caseQuery2({ filterString: '' })}                          
        )) as caseCount,
        (SELECT count(distinct HTAN_BIOSPECIMEN_ID) FROM specimen WHERE HTAN_BIOSPECIMEN_ID IN (
            SELECT DISTINCT bId
            FROM files f
            ARRAY JOIN biospecimenIds AS bId
        )) as sampleCount,
        (SELECT count(TISSUE_OR_ORGAN_OF_ORIGIN_UBERON_NAME) FROM (
            SELECT TISSUE_OR_ORGAN_OF_ORIGIN_UBERON_NAME FROM files
            ARRAY JOIN TISSUE_OR_ORGAN_OF_ORIGIN_UBERON_NAME
            WHERE TISSUE_OR_ORGAN_OF_ORIGIN_UBERON_NAME != '${NOT_REPORTED}'
            GROUP BY TISSUE_OR_ORGAN_OF_ORIGIN_UBERON_NAME
        )) as organCount
    `,
        phase2Client
    );

    const entitySummary = [
        { description: 'Atlases', text: entityCounts[0].atlasCount },
        { description: 'Organs', text: entityCounts[0].organCount },
        { description: 'Cases', text: entityCounts[0].caseCount },
        { description: 'Biospecimen', text: entityCounts[0].sampleCount },
    ];

    const organSum = _(organCounts)
        .groupBy('organType')
        .map((val, key) => {
            const distributionByCenter = _(val)
                .groupBy('atlas_name')
                .map((vv, center) => {
                    return {
                        center,
                        attributeFilterValues: [key],
                        totalCount: _.sumBy(vv, (v) => parseInt(v.count)),
                    };
                })
                .value();
            return {
                attributeName: 'organType',
                attributeValue: key,
                attributeFilterValues: [key],
                distributionByCenter,
                totalCount: _.sumBy(val, (v) => parseInt(v.count)),
            };
        })
        .value();

    const assaySum = _(assayCounts)
        .groupBy('assayName')
        .map((val, key) => {
            const distributionByCenter = _(val)
                .groupBy('atlas_name')
                .map((vv, center) => {
                    return {
                        center,
                        attributeFilterValues: [key],
                        totalCount: _.sumBy(vv, (v) => parseInt(v.count)),
                    };
                })
                .value();
            return {
                attributeName: 'assayName',
                attributeValue: key,
                attributeFilterValues: [key],
                distributionByCenter,
                totalCount: _.sumBy(val, (v) => parseInt(v.count)),
            };
        })
        .value();

    return {
        props: {
            synapseCounts: entitySummary,
            organSummary: organSum,
            assaySummary: assaySum,
        },
    };
};

export default Home;
