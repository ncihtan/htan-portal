import { NextRouter, withRouter } from 'next/router';
import React from 'react';
import { parseSelectedFiltersFromUrl } from '@htan/data-portal-filter';

import { ExploreURLQuery } from '../lib/helpers';

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
