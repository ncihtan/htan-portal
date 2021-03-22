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
import { ActionMeta } from 'react-select';
import { ScaleLoader } from 'react-spinners';

import { getAtlasList, WORDPRESS_BASE_URL } from '../ApiUtil';
import { filterFiles, groupsByAttrValue } from '../lib/filterHelpers';
import {
    Entity,
    loadData,
    LoadDataResult,
    parseSelectedFiltersFromUrl,
    updateSelectedFiltersInURL,
} from '../lib/helpers';
import {
    ExploreActionMeta,
    ExploreSelectedFilter,
    FilterAction,
    IFilterProps,
    IFilterValuesSetByGroupName,
} from '../lib/types';
import { WPAtlas } from '../types';
import PreReleaseBanner from '../components/PreReleaseBanner';
import HtanNavbar from '../components/HtanNavbar';
import Footer from '../components/Footer';
import FilterControls from '../components/filter/FilterControls';
import Filter from '../components/filter/Filter';
import ExploreTabs, { ExploreTab } from '../components/ExploreTabs';

import styles from './styles.module.scss';
import { ExploreSummary } from '../components/ExploreSummary';

export const getStaticProps: GetStaticProps = async (context) => {
    let slugs = ['summary-blurb-data-release'];
    let overviewURL = `${WORDPRESS_BASE_URL}${JSON.stringify(slugs)}`;
    let res = await fetch(overviewURL);
    //let data = await res.json();

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

    constructor(props: any) {
        super(props);
        this.state = { files: [], filters: {}, atlases: [] };

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
        return groupsByAttrValue(this.state.files);
    }

    get getGroupsByPropertyFiltered() {
        return groupsByAttrValue(this.filteredFiles);
    }

    @computed
    get selectedFilterValuesSetByGroupName(): IFilterValuesSetByGroupName {
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

    componentDidMount(): void {
        runInAction(() => {
            this.dataLoadingPromise = fromPromise(loadData(this.props.wpData));
            this.dataLoadingPromise.then(({ files, atlases }) => {
                this.setState({ files, atlases });
            });
        });
    }

    get filteredFiles() {
        return filterFiles(
            this.selectedFilterValuesSetByGroupName,
            this.state.files
        );
    }

    @computed
    get samples() {
        return _.chain(this.filteredFiles)
            .flatMapDeep((file) => file.biospecimen)
            .uniqBy((f) => f.HTANBiospecimenID)
            .value();
    }

    @computed
    get cases() {
        return _.chain(this.filteredFiles)
            .flatMapDeep((f: Entity) => f.diagnosis)
            .uniqBy((f) => f.HTANParticipantID)
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
                            this.selectedFilterValuesSetByGroupName
                        }
                        selectedFilters={this.selectedFilters}
                        files={this.state.files}
                        getGroupsByProperty={this.getGroupsByProperty}
                    />

                    <Filter
                        setFilter={this.setFilter}
                        selectedFiltersByGroupName={
                            this.selectedFilterValuesSetByGroupName
                        }
                    />

                    <ExploreSummary
                        filteredFiles={this.filteredFiles}
                        getGroupsByPropertyFiltered={
                            this.getGroupsByPropertyFiltered
                        }
                        patientCount={this.cases.length}
                    />

                    <ExploreTabs
                        router={this.props.router}
                        filteredFiles={this.filteredFiles}
                        samples={this.samples}
                        cases={this.cases}
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
    atlasData: any;
    router: NextRouter;
}

const FilterPage = (props: IFilterPageProps) => {
    return (
        <>
            <PreReleaseBanner />

            <HtanNavbar />

            <Search router={props.router} wpData={props.atlasData} />

            <Footer />
        </>
    );
};

export default withRouter(FilterPage);
