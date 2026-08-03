import { NextRouter } from 'next/router';
import React from 'react';
import { AtlasMetaData } from '@htan/data-portal-commons';
import { ExploreTab } from '@htan/data-portal-explore';
import {
    parseSelectedFiltersFromUrl,
    SelectedFilter,
} from '@htan/data-portal-filter';

import { ExploreURLQuery, updateSelectedFiltersInURL } from '../lib/helpers';

import PreReleaseBanner from './PreReleaseBanner';
import PageWrapper from './PageWrapper';

interface ExplorePageShellProps {
    router: NextRouter;
    getAtlasMetaData: () => AtlasMetaData;
    isReleaseQCEnabled: () => boolean;
}

export interface ExplorePageBaseProps {
    getAtlasMetaData: () => AtlasMetaData;
    onFilterChange: (selectedFilters: SelectedFilter[]) => void;
    getSelectedFilters: () => SelectedFilter[];
    isReleaseQCEnabled: () => boolean;
    getTab: () => ExploreTab;
}

interface ExplorePageShellPropsWithClientProps<TClientProps extends object> {
    ClientComponent: React.ComponentType<TClientProps>;
    mapClientProps: (props: ExplorePageBaseProps) => TClientProps;
}

type ExplorePageShellFullProps<
    TClientProps extends object
> = ExplorePageShellProps & ExplorePageShellPropsWithClientProps<TClientProps>;

export const ExplorePageShell = <TClientProps extends object>({
    router,
    getAtlasMetaData,
    isReleaseQCEnabled,
    ClientComponent,
    mapClientProps,
}: ExplorePageShellFullProps<TClientProps>) => {
    const getSelectedFilters = () =>
        parseSelectedFiltersFromUrl(
            (router.query as ExploreURLQuery).selectedFilters
        ) || [];

    const onFilterChange = (newFilters: SelectedFilter[]) => {
        updateSelectedFiltersInURL(newFilters, router);
    };

    const getExploreTab = () =>
        router.query.tab?.toString().toLowerCase() as ExploreTab;

    const clientProps = mapClientProps({
        getAtlasMetaData,
        onFilterChange,
        getSelectedFilters,
        isReleaseQCEnabled,
        getTab: getExploreTab,
    });

    return (
        <>
            <PreReleaseBanner />
            <PageWrapper>
                {React.createElement(ClientComponent, clientProps)}
            </PageWrapper>
        </>
    );
};

export default ExplorePageShell;
