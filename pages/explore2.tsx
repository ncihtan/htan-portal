import { NextRouter, withRouter } from 'next/router';
import React from 'react';
import { ExploreTab } from '@htan/data-portal-explore';
import {
    parseSelectedFiltersFromUrl,
    SelectedFilter,
} from '@htan/data-portal-filter';

import getAtlasMetaData from '../lib/getAtlasMetaData';
import {
    ExploreURLQuery,
    getCloudBaseUrl,
    isReleaseQCEnabled,
    updateSelectedFiltersInURL,
} from '../lib/helpers';

import PreReleaseBanner from '../components/PreReleaseBanner';
import PageWrapper from '../components/PageWrapper';
import Explore2ClientComponent from './explore2_client';

interface IExplore2PageProps {
    router: NextRouter;
}

const Explore2Page = (props: IExplore2PageProps) => {
    const getSelectedFilters = () =>
        parseSelectedFiltersFromUrl(
            (props.router.query as ExploreURLQuery).selectedFilters
        ) || [];
    const onFilterChange = (newFilters: SelectedFilter[]) => {
        updateSelectedFiltersInURL(newFilters, props.router);
    };
    const getExploreTab = () =>
        props.router.query.tab?.toString().toLowerCase() as ExploreTab;

    return (
        <>
            <PreReleaseBanner />

            <PageWrapper>
                <Explore2ClientComponent
                    getAtlasMetaData={getAtlasMetaData}
                    onFilterChange={onFilterChange}
                    getSelectedFilters={getSelectedFilters}
                    isReleaseQCEnabled={isReleaseQCEnabled}
                    getTab={getExploreTab}
                    cloudBaseUrl={getCloudBaseUrl()}
                />
            </PageWrapper>
        </>
    );
};

export default withRouter(Explore2Page);
