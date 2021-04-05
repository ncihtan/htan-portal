import _ from 'lodash';
import {
    action,
    computed,
    makeObservable,
    observable,
    runInAction,
} from 'mobx';
import { observer } from 'mobx-react';
import { fromPromise, IPromiseBasedObservable } from 'mobx-utils';
import { GetStaticProps } from 'next';
import { withRouter, NextRouter } from 'next/router';
import fetch from 'node-fetch';
import React from 'react';
import { ScaleLoader } from 'react-spinners';

import { getAtlasList, WORDPRESS_BASE_URL } from '../ApiUtil';
import {
    filterFiles,
    groupFilesByAttrNameAndValue,
} from '../lib/filterHelpers';
import {
    Atlas,
    Entity,
    loadData,
    LoadDataResult,
    parseSelectedFiltersFromUrl,
    updateSelectedFiltersInURL,
} from '../lib/helpers';
import {
    AttributeNames,
    ExploreActionMeta,
    ExploreSelectedFilter,
    FilterAction,
    IFilterProps,
    ISelectedFiltersByAttrName,
} from '../lib/types';
import { WPAtlas } from '../types';
import PreReleaseBanner from '../components/PreReleaseBanner';
import FilterControls from '../components/filter/FilterControls';
import Filter from '../components/filter/Filter';
import ExploreTabs, { ExploreTab } from '../components/ExploreTabs';

import styles from './styles.module.scss';
import { ExploreSummary } from '../components/ExploreSummary';
import PageWrapper from '../components/PageWrapper';
import { DataSchemaData, getSchemaDataMap } from '../lib/dataSchemaHelpers';

export const getStaticProps: GetStaticProps = async (context) => {
    let slugs = ['summary-blurb-data-release'];
    let overviewURL = `${WORDPRESS_BASE_URL}${JSON.stringify(slugs)}`;
    let res = await fetch(overviewURL);

    const atlases = await getAtlasList();

    return {
        props: {
            atlasData: atlases,
            //data,
        },
    };
};

export type ExploreURLQuery = {
    selectedFilters: string | undefined;
    tab: ExploreTab;
};

@observer
class Search extends React.Component<
    { router: NextRouter; wpData: WPAtlas[] },
    IFilterProps
> {
    @observable.ref private dataLoadingPromise:
        | IPromiseBasedObservable<LoadDataResult>
        | undefined;

    @observable.ref private schemaLoadingPromise:
        | IPromiseBasedObservable<{ [id: string]: DataSchemaData }>
        | undefined;

    constructor(props: any) {
        super(props);
        this.state = {
            files: [],
            filters: {},
            atlases: [],
            schemaDataById: {},
        };

        //@ts-ignore
        if (typeof window !== 'undefined') (window as any).me = this;

        makeObservable(this);
    }

    get selectedFilters(): ExploreSelectedFilter[] {
        return (
            parseSelectedFiltersFromUrl(
                (this.props.router.query as ExploreURLQuery).selectedFilters // use casting as ExploreURLQuery to use typescript to ensure URL correctness
            ) || []
        );
    }

    get getGroupsByProperty() {
        return groupFilesByAttrNameAndValue(this.state.files);
    }

    get getGroupsByPropertyFiltered() {
        return groupFilesByAttrNameAndValue(this.filteredFiles);
    }

    @computed
    get selectedFiltersByAttrName(): ISelectedFiltersByAttrName {
        return _.chain(this.selectedFilters)
            .groupBy((item) => item.group)
            .mapValues((filters: ExploreSelectedFilter[]) => {
                return new Set(filters.map((f) => f.value));
            })
            .value();
    }

    @action.bound
    setFilter(actionMeta: ExploreActionMeta<ExploreSelectedFilter>) {
        let newFilters: ExploreSelectedFilter[] = this.selectedFilters;
        switch (actionMeta.action) {
            case FilterAction.CLEAR_ALL:
                // Deselect all filters
                newFilters = [];
                break;
            case FilterAction.CLEAR:
                if (actionMeta.option) {
                    // Deselect all options for the given group
                    newFilters = this.selectedFilters.filter((o) => {
                        return o.group !== actionMeta.option!.group;
                    });
                }
                break;
            case FilterAction.SELECT:
            case FilterAction.DESELECT:
                if (actionMeta.option) {
                    // first remove the item
                    newFilters = this.selectedFilters.filter((o) => {
                        return (
                            o.group !== actionMeta.option!.group! ||
                            o.value !== actionMeta.option!.value!
                        );
                    });
                    if (actionMeta.action === 'select-option') {
                        // Add it back if selecting
                        const option = actionMeta.option;
                        newFilters = newFilters.concat([option]);
                    }
                }
                break;
        }

        updateSelectedFiltersInURL(newFilters, this.props.router);
    }

    @action.bound
    onSelectAtlas(selected: Atlas[]) {
        const group = AttributeNames.AtlasName;

        // remove all previous atlas filters
        const newFilters: ExploreSelectedFilter[] =
            this.selectedFilters.filter((f) => f.group !== group) || [];

        // add the new ones
        newFilters.push(
            ...selected.map((a) => ({ group, value: a.htan_name }))
        );

        updateSelectedFiltersInURL(newFilters, this.props.router);
    }

    componentDidMount(): void {
        runInAction(() => {
            this.dataLoadingPromise = fromPromise(loadData(this.props.wpData));
            this.dataLoadingPromise.then(({ files, atlases }) => {
                this.setState({ files, atlases });
            });

            this.schemaLoadingPromise = fromPromise(getSchemaDataMap());
            this.schemaLoadingPromise.then((schemaDataById) => {
                this.setState({ schemaDataById });
            });
        });
    }

    get filteredFiles() {
        return filterFiles(this.selectedFiltersByAttrName, this.state.files);
    }

    @computed
    get filteredSamples() {
        return _.chain(this.filteredFiles)
            .flatMapDeep((file) => file.biospecimen)
            .uniqBy((f) => f.HTANBiospecimenID)
            .value();
    }

    @computed
    get filteredCases() {
        return _.chain(this.filteredFiles)
            .flatMapDeep((f: Entity) => f.diagnosis)
            .uniqBy((f) => f.HTANParticipantID)
            .value();
    }

    @computed
    get filteredAtlases() {
        // get only atlases associated with filtered files
        return _.chain(this.filteredFiles)
            .map((f) => f.atlas)
            .uniq()
            .value();
    }

    @computed
    get selectedAtlases() {
        const atlasFilters = this.selectedFiltersByAttrName[
            AttributeNames.AtlasName
        ];

        if (_.size(atlasFilters)) {
            return _.chain(
                filterFiles(
                    { [AttributeNames.AtlasName]: atlasFilters },
                    this.state.files
                )
            )
                .map((f) => f.atlas)
                .uniq()
                .value();
        } else {
            return [];
        }
    }

    @computed
    get filteredAtlasesByNonAtlasFilters() {
        const filtersExpectAtlasFilters = _.omit(
            this.selectedFiltersByAttrName,
            [AttributeNames.AtlasName]
        );

        return _.chain(filterFiles(filtersExpectAtlasFilters, this.state.files))
            .map((f) => f.atlas)
            .uniq()
            .value();
    }

    @computed
    get allAtlases() {
        return _.chain(this.state.files)
            .map((f) => f.atlas)
            .uniq()
            .value();
    }

    render() {
        if (
            !this.dataLoadingPromise ||
            this.dataLoadingPromise.state === 'pending'
        ) {
            // TODO: Pretty this up
            return (
                <div className={styles.loadingIndicator}>
                    <ScaleLoader />
                </div>
            );
        }

        if (this.filteredFiles) {
            return (
                <div className={'explorePageWrapper'}>
                    <FilterControls
                        setFilter={this.setFilter}
                        selectedFiltersByGroupName={
                            this.selectedFiltersByAttrName
                        }
                        selectedFilters={this.selectedFilters}
                        files={this.state.files}
                        getGroupsByProperty={this.getGroupsByProperty}
                    />

                    <Filter
                        setFilter={this.setFilter}
                        selectedFiltersByGroupName={
                            this.selectedFiltersByAttrName
                        }
                    />

                    <ExploreSummary
                        filteredFiles={this.filteredFiles}
                        getGroupsByPropertyFiltered={
                            this.getGroupsByPropertyFiltered
                        }
                        patientCount={this.filteredCases.length}
                    />

                    <ExploreTabs
                        router={this.props.router}
                        schemaDataById={this.state.schemaDataById}
                        filteredFiles={this.filteredFiles}
                        filteredSynapseAtlases={this.filteredAtlases}
                        filteredSynapseAtlasesByNonAtlasFilters={
                            this.filteredAtlasesByNonAtlasFilters
                        }
                        selectedSynapseAtlases={this.selectedAtlases}
                        allSynapseAtlases={this.allAtlases}
                        onSelectAtlas={this.onSelectAtlas}
                        samples={this.filteredSamples}
                        cases={this.filteredCases}
                        wpData={this.props.wpData}
                        getGroupsByPropertyFiltered={
                            this.getGroupsByPropertyFiltered
                        }
                    />
                </div>
            );
        }
    }
}

interface IFilterPageProps {
    atlasData: WPAtlas[];
    router: NextRouter;
}

const FilterPage = (props: IFilterPageProps) => {
    return (
        <>
            <PreReleaseBanner />

            <PageWrapper>
                <Search router={props.router} wpData={props.atlasData} />
            </PageWrapper>
        </>
    );
};

export default withRouter(FilterPage);
