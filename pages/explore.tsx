import { NextRouter, withRouter } from 'next/router';
import React from 'react';
import { Explore, ExploreTab } from '@htan/data-portal-explore';
import {
    parseSelectedFiltersFromUrl,
    SelectedFilter,
} from '@htan/data-portal-filter';

import {
    ExploreURLQuery,
    fetchData,
    getCloudBaseUrl,
    isReleaseQCEnabled,
    setTab,
    updateSelectedFiltersInURL,
} from '../lib/helpers';
import getAtlasMetaData from '../lib/getAtlasMetaData';
import PreReleaseBanner from '../components/PreReleaseBanner';
import PageWrapper from '../components/PageWrapper';

interface IExplorePageProps {
    router: NextRouter;
}

const ExplorePage = (props: IExplorePageProps) => {
    const getSelectedFilters = () =>
        parseSelectedFiltersFromUrl(
            (props.router.query as ExploreURLQuery).selectedFilters // use casting as ExploreURLQuery to use typescript to ensure URL correctness
        ) || [];
    const onFilterChange = (newFilters: SelectedFilter[]) => {
        updateSelectedFiltersInURL(newFilters, props.router);
    };
    const setExploreTab = (tab: ExploreTab) => {
        setTab(tab, props.router);
    };
    const getExploreTab = () =>
        (props.router.query.tab || ExploreTab.ATLAS) as ExploreTab;

    return (
        <>
            <PreReleaseBanner />

            <PageWrapper>
                <Explore
                    getAtlasMetaData={getAtlasMetaData}
                    onFilterChange={onFilterChange}
                    getSelectedFilters={getSelectedFilters}
                    isReleaseQCEnabled={isReleaseQCEnabled}
                    setTab={setExploreTab}
                    getTab={getExploreTab}
                    fetchData={fetchData}
                    cloudBaseUrl={getCloudBaseUrl()}
                />
            </PageWrapper>
        </>
    );
};

export default withRouter(ExplorePage);
