'use client';
import React from 'react';
import dynamic from 'next/dynamic';
import { doQuery, getHtan2Client } from '@htan/data-portal-commons';
import { ExploreTab, IExploreProps } from '@htan/data-portal-explore';

const ExploreComponent = dynamic(
    () => import('@htan/data-portal-explore').then((mod) => mod.Explore),
    {
        // Prevent server-side rendering – ClickHouse client is browser-only
        ssr: false,
    }
);

/** Generic query function that routes requests to the Phase-2 ClickHouse DB. */
function htan2DoQuery<T>(str: any): Promise<T[]> {
    return doQuery<T>(str, getHtan2Client());
}

/**
 * Wrapper that injects a Phase-2 ClickHouse client so that every query
 * issued by the Explore component targets the htan2_<PR> database instead
 * of the default htan_<YEAR>_<PR> database.
 *
 * Only the Files tab is enabled for now because the Phase 2 database only
 * contains the `files` table (no atlases, cases, specimen, or
 * publication_manifest tables).
 */
function Explore2ClientComponent(props: IExploreProps) {
    return (
        <ExploreComponent
            {...props}
            doQuery={htan2DoQuery}
            tabs={[ExploreTab.FILE]}
        />
    );
}

export default Explore2ClientComponent;
