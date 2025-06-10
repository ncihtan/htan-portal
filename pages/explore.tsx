import { NextRouter, withRouter } from 'next/router';
import React from 'react';
import { ExploreTab } from '@htan/data-portal-explore';
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

import PreReleaseBanner from '../components/PreReleaseBanner';
import PageWrapper from '../components/PageWrapper';
import ClientComponent from './monkey';

interface IExplorePageProps {
    router: NextRouter;
}

const ExplorePage = (props: IExplorePageProps) => {
    const getSelectedFilters = () =>
        parseSelectedFiltersFromUrl(
            (props.router.query as ExploreURLQuery).selectedFilters // use casting as ExploreURLQuery to use typescript to ensure URL correctness
        ) || [];
    // const onFilterChange = (newFilters: SelectedFilter[]) => {
    //     updateSelectedFiltersInURL(newFilters, props.router);
    // };
    // const setExploreTab = (tab: ExploreTab) => {
    //     setTab(tab, props.router);
    // };
    const getExploreTab = () =>
        (props.router.query.tab || ExploreTab.ATLAS) as ExploreTab;

    return (
        <>
            <PreReleaseBanner />

            <PageWrapper>
                <ClientComponent></ClientComponent>
            </PageWrapper>
        </>
    );
};

export default withRouter(ExplorePage);
