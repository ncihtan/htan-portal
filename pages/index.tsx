import React from 'react';
import _ from 'lodash';

import {
    caseQuery,
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
    const assayCounts = await doQuery<{
        assayName: string;
        atlas_name: string;
        count: string;
    }>(`
        SELECT
            assayName,
            atlas_name,
            COUNT(distinct demographicsIds) AS count
        FROM files
        ARRAY JOIN demographicsIds
        GROUP BY
            assayName, atlas_name
    `);

    const organCounts = await doQuery<{
        organType: string;
        atlas_name: string;
        count: string;
    }>(`
        SELECT 
            organType,
            atlas_name, 
            count(DISTINCT ParticipantID) as count 
        FROM (
            ${caseQuery({ filterString: '' })}
        )
        ARRAY JOIN organType
        GROUP BY 
            organType, atlas_name
    `);

    const entityCounts = await doQuery<{
        atlasCount: string;
        caseCount: string;
        sampleCount: string;
        organCount: string;
    }>(`
        SELECT (SELECT count(*) FROM atlases) as atlasCount,
        (SELECT count(*) FROM (
            ${caseQuery({ filterString: '' })}                          
        )) as caseCount,
        (SELECT count(distinct BiospecimenID) FROM specimen WHERE BiospecimenID IN (
            SELECT DISTINCT bId
            FROM files f
            ARRAY JOIN biospecimenIds AS bId
        )) as sampleCount,
        (SELECT count(organType) FROM (
            SELECT organType FROM files
            ARRAY JOIN organType
            WHERE organType != '${NOT_REPORTED}'
            GROUP BY organType
        )) as organCount
    `);

    const phase1EntitySummary = [
        { description: 'Atlases', text: entityCounts[0].atlasCount },
        { description: 'Organs', text: entityCounts[0].organCount },
        { description: 'Cases', text: entityCounts[0].caseCount },
        { description: 'Biospecimen', text: entityCounts[0].sampleCount },
    ];

    const phase1OrganSummary = _(organCounts)
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

    const phase1AssaySummary = _(assayCounts)
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

    const phase2Client = getPhase2Client();

    const phase2EntityCounts = await doQuery<{
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
        (SELECT count(organType) FROM (
            SELECT organType FROM files
            ARRAY JOIN organType
            WHERE organType != '${NOT_REPORTED}'
            GROUP BY organType
        )) as organCount
    `,
        phase2Client
    );

    const phase2EntitySummary = [
        { description: 'Atlases', text: phase2EntityCounts[0].atlasCount },
        { description: 'Organs', text: phase2EntityCounts[0].organCount },
        { description: 'Cases', text: phase2EntityCounts[0].caseCount },
        { description: 'Biospecimen', text: phase2EntityCounts[0].sampleCount },
    ];

    return {
        props: {
            synapseCounts: phase1EntitySummary,
            phase2SynapseCounts: phase2EntitySummary,
            organSummary: phase1OrganSummary,
            assaySummary: phase1AssaySummary,
        },
    };
};

export default Home;
