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
import React from 'react';
import { ScaleLoader } from 'react-spinners';

import { getAtlasList, WORDPRESS_BASE_URL } from '../ApiUtil';
import {
    filterFiles,
    getFileFilterDisplayName,
    getFilteredCases,
    getFilteredSamples,
    getNewFilters,
    getSelectedFiltersByAttrName,
    groupFilesByAttrNameAndValue,
} from '../lib/filterHelpers';
import {
    Atlas,
    fetchData,
    fillInEntities,
    LoadDataResult,
    parseSelectedFiltersFromUrl,
    updateSelectedFiltersInURL,
} from '../lib/helpers';
import {
    AttributeNames,
    ExploreActionMeta,
    ExploreSelectedFilter,
    IFilterProps,
    ISelectedFiltersByAttrName,
} from '../lib/types';
import { WPAtlas } from '../types';
import PreReleaseBanner from '../components/PreReleaseBanner';
import FileFilterControls from '../components/filter/FileFilterControls';
import Filter from '../components/filter/Filter';
import ExploreTabs, { ExploreTab } from '../components/ExploreTabs';

import styles from './styles.module.scss';
import { ExploreSummary } from '../components/ExploreSummary';
import PageWrapper from '../components/PageWrapper';
import { fetchAndProcessSchemaData } from '../lib/dataSchemaHelpers';

export const getStaticProps: GetStaticProps = async (context) => {
    //let slugs = ['summary-blurb-data-release'];
    //let overviewURL = `${WORDPRESS_BASE_URL}${JSON.stringify(slugs)}`;
    //let res = await fetch(overviewURL);

    const wpAtlases = await getAtlasList();

    return {
        props: {
            wpAtlases,
        },
    };
};

export type ExploreURLQuery = {
    selectedFilters: string | undefined;
    tab: ExploreTab;
};

@observer
class Search extends React.Component<
    { router: NextRouter; wpAtlases: WPAtlas[] },
    IFilterProps
> {
    @observable.ref private dataLoadingPromise:
        | IPromiseBasedObservable<LoadDataResult>
        | undefined;
    @observable private showAllBiospecimens = false;
    @observable private showAllCases = false;

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

    @action.bound toggleShowAllBiospecimens() {
        this.showAllBiospecimens = !this.showAllBiospecimens;
    }
    @action.bound toggleShowAllCases() {
        this.showAllCases = !this.showAllCases;
    }

    get selectedFilters(): ExploreSelectedFilter[] {
        return (
            parseSelectedFiltersFromUrl(
                (this.props.router.query as ExploreURLQuery).selectedFilters // use casting as ExploreURLQuery to use typescript to ensure URL correctness
            ) || []
        );
    }

    get groupsByProperty() {
        return groupFilesByAttrNameAndValue(this.state.files);
    }

    get groupsByPropertyFiltered() {
        return groupFilesByAttrNameAndValue(this.filteredFiles);
    }

    @computed
    get selectedFiltersByAttrName(): ISelectedFiltersByAttrName {
        return getSelectedFiltersByAttrName(this.selectedFilters);
    }

    @action.bound
    setFilter(actionMeta: ExploreActionMeta<ExploreSelectedFilter>) {
        const newFilters = getNewFilters(this.selectedFilters, actionMeta);
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
            this.dataLoadingPromise = fromPromise(fetchData());
            this.dataLoadingPromise.then((data) => {
                this.setState({
                    files: fillInEntities(data),
                    atlases: data.atlases,
                });
            });

            const schemaLoadingPromise = fromPromise(
                fetchAndProcessSchemaData()
            );
            schemaLoadingPromise.then((schemaDataById) => {
                this.setState({ schemaDataById });
            });
        });
    }

    @computed
    get filteredFiles() {
        return filterFiles(this.selectedFiltersByAttrName, this.state.files);
    }

    @computed
    get filteredFilesByNonAtlasFilters() {
        return filterFiles(
            this.nonAtlasSelectedFiltersByAttrName,
            this.state.files
        );
    }

    @computed
    get filteredSamples() {
        return getFilteredSamples(
            this.filteredFiles,
            this.filteredCases,
            this.showAllBiospecimens
        );
    }

    @computed
    get filteredSamplesByNonAtlasFilters() {
        return getFilteredSamples(
            this.filteredFilesByNonAtlasFilters,
            this.filteredCasesByNonAtlasFilters,
            this.showAllBiospecimens
        );
    }

    @computed
    get filteredCases() {
        return getFilteredCases(
            this.filteredFiles,
            this.selectedFiltersByAttrName,
            this.showAllCases
        );
    }

    @computed
    get filteredCasesByNonAtlasFilters() {
        return getFilteredCases(
            this.filteredFilesByNonAtlasFilters,
            this.nonAtlasSelectedFiltersByAttrName,
            this.showAllCases
        );
    }

    @computed get atlasMap() {
        return _.keyBy(this.state.atlases, (a) => a.htan_id);
    }

    @computed
    get filteredAtlases() {
        // get only atlases associated with filtered files
        return _.chain(this.filteredFiles)
            .map((f) => f.atlasid)
            .uniq()
            .map((id) => this.atlasMap[id])
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
                .map((f) => f.atlasid)
                .uniq()
                .map((id) => this.atlasMap[id])
                .value();
        } else {
            return [];
        }
    }

    @computed get nonAtlasSelectedFiltersByAttrName() {
        return _.omit(this.selectedFiltersByAttrName, [
            AttributeNames.AtlasName,
        ]);
    }

    @computed
    get filteredAtlasesByNonAtlasFilters() {
        const filtersExceptAtlasFilters = this
            .nonAtlasSelectedFiltersByAttrName;

        return _.chain(filterFiles(filtersExceptAtlasFilters, this.state.files))
            .map((f) => f.atlasid)
            .uniq()
            .map((id) => this.atlasMap[id])
            .value();
    }

    @computed
    get allAtlases() {
        return _.chain(this.state.files)
            .map((f) => f.atlasid)
            .uniq()
            .map((id) => this.atlasMap[id])
            .value();
    }

    render() {
        if (
            !this.dataLoadingPromise ||
            this.dataLoadingPromise.state === 'pending'
        ) {
            return (
                <div className={styles.loadingIndicator}>
                    <ScaleLoader />
                </div>
            );
        }

        if (this.filteredFiles) {
            return (
                <div className={'pageWrapper explorePage'}>
                    <FileFilterControls
                        setFilter={this.setFilter}
                        selectedFiltersByGroupName={
                            this.selectedFiltersByAttrName
                        }
                        selectedFilters={this.selectedFilters}
                        entities={this.state.files}
                        groupsByProperty={this.groupsByProperty}
                    />

                    <Filter
                        setFilter={this.setFilter}
                        selectedFiltersByGroupName={
                            this.selectedFiltersByAttrName
                        }
                        getFilterDisplayName={getFileFilterDisplayName}
                    />

                    <ExploreSummary
                        filteredFiles={this.filteredFiles}
                        groupsByPropertyFiltered={this.groupsByPropertyFiltered}
                        filteredBiospecimenCount={this.filteredSamples.length}
                        filteredCaseCount={this.filteredCases.length}
                    />

                    <ExploreTabs
                        router={this.props.router}
                        schemaDataById={this.state.schemaDataById}
                        files={this.state.files}
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
                        filteredCasesByNonAtlasFilters={
                            this.filteredCasesByNonAtlasFilters
                        }
                        filteredSamplesByNonAtlasFilters={
                            this.filteredSamplesByNonAtlasFilters
                        }
                        nonAtlasSelectedFiltersByAttrName={
                            this.nonAtlasSelectedFiltersByAttrName
                        }
                        wpData={this.props.wpAtlases}
                        groupsByPropertyFiltered={this.groupsByPropertyFiltered}
                        showAllBiospecimens={this.showAllBiospecimens}
                        showAllCases={this.showAllCases}
                        toggleShowAllBiospecimens={
                            this.toggleShowAllBiospecimens
                        }
                        toggleShowAllCases={this.toggleShowAllCases}
                    />
                </div>
            );
        }
    }
}

interface IFilterPageProps {
    wpAtlases: WPAtlas[];
    router: NextRouter;
}

const FilterPage = (props: IFilterPageProps) => {
    return (
        <>
            <PreReleaseBanner />

            <PageWrapper>
                <Search router={props.router} wpAtlases={props.wpAtlases} />
            </PageWrapper>
        </>
    );
};

export default withRouter(FilterPage);
