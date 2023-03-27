import { GetStaticProps } from 'next';
import PreReleaseBanner from '../components/PreReleaseBanner';
import PageWrapper from '../components/PageWrapper';
import { getToolData, Tools } from '../lib/tools';
import ToolTable from '../components/ToolTable';
import Filter from '../components/filter/Filter';
import React from 'react';
import ToolFilterControls from '../components/filter/ToolFilterControls';
import { observer } from 'mobx-react';
import { NextRouter, withRouter } from 'next/router';
import { ExploreActionMeta, ExploreSelectedFilter } from '../lib/types';
import {
    parseSelectedFiltersFromUrl,
    updateSelectedFiltersInURL,
} from '../lib/helpers';
import { ExploreURLQuery } from './explore';
import {
    filtertools,
    getNewFilters,
    getSelectedFiltersByAttrName,
    getToolFilterDisplayName,
    groupToolsByAttrNameAndValue,
} from '../lib/filterHelpers';
import { action } from 'mobx';

const ToolPage = observer((props: { router: NextRouter; tools: Tools }) => {
    const selectedFilters =
        parseSelectedFiltersFromUrl(
            (props.router.query as ExploreURLQuery).selectedFilters // use casting as ExploreURLQuery to use typescript to ensure URL correctness
        ) || [];
    const setFilter = action(
        (actionMeta: ExploreActionMeta<ExploreSelectedFilter>) => {
            const newFilters = getNewFilters(selectedFilters, actionMeta);
            updateSelectedFiltersInURL(newFilters, props.router);
        }
    );
    const selectedFiltersByAttrName = getSelectedFiltersByAttrName(
        selectedFilters
    );
    const groupsByProperty = groupToolsByAttrNameAndValue(props.tools.data);
    const filteredTools = filtertools(
        selectedFiltersByAttrName,
        props.tools.data
    );

    return (
        <>
            <PreReleaseBanner />
            <PageWrapper>
                <div className={'pageWrapper explorePage'}>
                    <ToolFilterControls
                        setFilter={setFilter}
                        selectedFiltersByGroupName={selectedFiltersByAttrName}
                        selectedFilters={selectedFilters}
                        entities={props.tools.data}
                        groupsByProperty={groupsByProperty}
                    />

                    <Filter
                        setFilter={setFilter}
                        selectedFiltersByGroupName={selectedFiltersByAttrName}
                        getFilterDisplayName={getToolFilterDisplayName}
                    />

                    <ToolTable
                        tools={{ ...props.tools, data: filteredTools }}
                    />
                </div>
            </PageWrapper>
        </>
    );
});

export default withRouter(ToolPage);

export const getStaticProps: GetStaticProps = async (context) => {
    const tools = getToolData();
    return { props: { tools } };
};
