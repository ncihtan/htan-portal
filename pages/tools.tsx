import { GetStaticProps } from 'next';
import PreReleaseBanner from '../components/PreReleaseBanner';
import PageWrapper from '../components/PageWrapper';
import { getToolData, Tools } from '../lib/tools';
import ToolTable from '../components/ToolTable';
import React from 'react';
import ToolFilterControls from '../components/filter/ToolFilterControls';
import { observer } from 'mobx-react';
import { NextRouter, withRouter } from 'next/router';
import { ExploreURLQuery, updateSelectedFiltersInURL } from '../lib/helpers';
import {
    filtertools,
    getToolFilterDisplayName,
    groupToolsByAttrNameAndValue,
} from '../lib/filterHelpers';
import { parseSelectedFiltersFromUrl } from '@htan/data-portal-filter';
import { action } from 'mobx';

import {
    Filter,
    FilterActionMeta,
    getNewFilters,
    getSelectedFiltersByAttrName,
    SelectedFilter,
} from '@htan/data-portal-filter';

import styles from './tools.module.scss';

const ToolPage = observer((props: { router: NextRouter; tools: Tools }) => {
    const selectedFilters =
        parseSelectedFiltersFromUrl(
            (props.router.query as ExploreURLQuery).selectedFilters // use casting as ExploreURLQuery to use typescript to ensure URL correctness
        ) || [];
    const setFilter = action((actionMeta: FilterActionMeta<SelectedFilter>) => {
        const newFilters = getNewFilters(selectedFilters, actionMeta);
        updateSelectedFiltersInURL(newFilters, props.router);
    });
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
                <div className={styles.tools}>
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
