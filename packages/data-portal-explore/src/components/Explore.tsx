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
import { ScaleLoader } from 'react-spinners';
import React from 'react';
import {
    Filter,
    FilterActionMeta,
    getNewFilters,
    getSelectedFiltersByAttrName,
    ISelectedFiltersByAttrName,
    SelectedFilter,
} from '@htan/data-portal-filter';
import {
    Atlas,
    AtlasMetaData,
    Entity,
    fetchDefaultSynData,
    fillInEntities,
    filterFiles,
    getFileFilterDisplayName,
    getFilteredCases,
    getFilteredSamples,
    groupFilesByAttrNameAndValue,
    HTANToGenericAttributeMap,
    LoadDataResult,
} from '@htan/data-portal-commons';
import { AttributeNames } from '@htan/data-portal-utils';
import {
    DataSchemaData,
    fetchAndProcessSchemaData,
} from '@htan/data-portal-schema';

import { ExploreSummary } from './ExploreSummary';
import { ExploreTabs } from './ExploreTabs';
import { FileFilterControls } from './FileFilterControls';
import { getDefaultSummaryData } from '../lib/helpers';
import { ExploreTab } from '../lib/types';

import commonStyles from './common.module.scss';
import styles from './explore.module.scss';

export interface IExploreState {
    files: Entity[];
    filters: { [key: string]: string[] };
    schemaDataById?: { [schemaDataId: string]: DataSchemaData };
    atlases: Atlas[];
    atlasData?: any;
}

export interface IExploreProps {
    getAtlasMetaData: () => AtlasMetaData;
    publications: { [id: string]: { cite: string } };
    publicationPageLink: { [id: string]: { id: string; show: boolean } };
    onFilterChange?: (selectedFilters: SelectedFilter[]) => void;
    getSelectedFilters?: () => SelectedFilter[];
    isReleaseQCEnabled?: () => boolean;
    setTab?: (tab: ExploreTab) => void;
    getTab?: () => ExploreTab;
    fetchData?: () => Promise<LoadDataResult>;
}

@observer
export class Explore extends React.Component<IExploreProps, IExploreState> {
    @observable.ref private dataLoadingPromise:
        | IPromiseBasedObservable<LoadDataResult>
        | undefined;
    @observable private showAllBiospecimens = false;
    @observable private showAllCases = false;
    @observable private _selectedFilters: SelectedFilter[] = [];

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

    get selectedFilters(): SelectedFilter[] {
        return this.props.getSelectedFilters
            ? this.props.getSelectedFilters()
            : this._selectedFilters;
    }

    set selectedFilters(filters: SelectedFilter[]) {
        if (this.props.onFilterChange) {
            this.props.onFilterChange(filters);
        } else {
            this._selectedFilters = filters;
        }
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
    setFilter(actionMeta: FilterActionMeta<SelectedFilter>) {
        this.selectedFilters = getNewFilters(this.selectedFilters, actionMeta);
    }

    @action.bound
    onSelectAtlas(selected: Atlas[]) {
        const group = AttributeNames.AtlasName;

        // remove all previous atlas filters
        const newFilters: SelectedFilter[] =
            this.selectedFilters.filter((f) => f.group !== group) || [];

        // add the new ones
        newFilters.push(
            ...selected.map((a) => ({ group, value: a.htan_name }))
        );

        if (this.props.onFilterChange) {
            this.props.onFilterChange(newFilters);
        }
    }

    componentDidMount(): void {
        runInAction(() => {
            this.dataLoadingPromise = fromPromise(
                this.props.fetchData
                    ? this.props.fetchData()
                    : fetchDefaultSynData()
            );
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
                <div className={commonStyles.loadingIndicator}>
                    <ScaleLoader />
                </div>
            );
        }

        if (this.filteredFiles) {
            return (
                <div className={styles.explore}>
                    <FileFilterControls
                        setFilter={this.setFilter}
                        selectedFiltersByGroupName={
                            this.selectedFiltersByAttrName
                        }
                        selectedFilters={this.selectedFilters}
                        entities={this.state.files}
                        groupsByProperty={this.groupsByProperty}
                        enableReleaseFilter={
                            this.props.isReleaseQCEnabled
                                ? this.props.isReleaseQCEnabled()
                                : false
                        }
                    />

                    <Filter
                        setFilter={this.setFilter}
                        selectedFiltersByGroupName={
                            this.selectedFiltersByAttrName
                        }
                        getFilterDisplayName={getFileFilterDisplayName}
                    />

                    <ExploreSummary
                        summaryData={getDefaultSummaryData(
                            this.filteredCases,
                            this.filteredSamples,
                            this.filteredFiles,
                            this.groupsByPropertyFiltered
                        )}
                    />

                    <ExploreTabs
                        setTab={this.props.setTab}
                        getTab={this.props.getTab}
                        schemaDataById={this.state.schemaDataById}
                        files={this.state.files}
                        filteredFiles={this.filteredFiles}
                        filteredSynapseAtlases={this.filteredAtlases}
                        filteredSynapseAtlasesByNonAtlasFilters={
                            this.filteredAtlasesByNonAtlasFilters
                        }
                        filteredSamples={this.filteredSamples}
                        filteredCases={this.filteredCases}
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
                        groupsByPropertyFiltered={this.groupsByPropertyFiltered}
                        showAllBiospecimens={this.showAllBiospecimens}
                        showAllCases={this.showAllCases}
                        toggleShowAllBiospecimens={
                            this.toggleShowAllBiospecimens
                        }
                        toggleShowAllCases={this.toggleShowAllCases}
                        getAtlasMetaData={this.props.getAtlasMetaData}
                        publications={this.props.publications}
                        publicationPageLink={this.props.publicationPageLink}
                        genericAttributeMap={HTANToGenericAttributeMap} // TODO needs to be configurable, different mappings for each portal
                    />
                </div>
            );
        }
    }
}

export default Explore;
