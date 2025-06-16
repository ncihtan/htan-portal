'use client';
import _ from 'lodash';
import remoteData, { MobxPromise } from 'mobxpromise';
import { action, makeObservable, observable, toJS } from 'mobx';
import { observer } from 'mobx-react';
import { IPromiseBasedObservable } from 'mobx-utils';
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
    commonStyles,
    Entity,
    filterFiles,
    getFileFilterDisplayName,
    HTANToGenericAttributeMap,
    LoadDataResult,
    PublicationManifest,
} from '@htan/data-portal-commons';
import { AttributeNames } from '@htan/data-portal-utils';
import { DataSchemaData } from '@htan/data-portal-schema';

import { ExploreSummary } from './ExploreSummary';
import { ExploreTabs } from './ExploreTabs';
import { getDefaultSummaryData } from '../lib/helpers';
import { CountByType, ExploreTab } from '../lib/types';

import styles from './explore.module.scss';
import {
    atlasQuery,
    caseQuery,
    doQuery,
    fileQuery,
    countsByTypeQuery,
    specimenQuery,
} from '../../../../lib/clickhouseStore';
import FileFilterControls from './FileFilterControls';
import getAtlasMetaData from '../../../../lib/getAtlasMetaData';

export interface IExploreState {
    files: Entity[];
    filters: { [key: string]: string[] };
    schemaDataById?: { [schemaDataId: string]: DataSchemaData };
    atlases: Atlas[];
    publicationManifestByUid: { [uid: string]: PublicationManifest };
    atlasData?: any;
}

export interface IExploreProps {
    getAtlasMetaData?: () => AtlasMetaData;
    onFilterChange?: (selectedFilters: SelectedFilter[]) => void;
    getSelectedFilters?: () => SelectedFilter[];
    isReleaseQCEnabled?: () => boolean;
    setTab?: (tab: ExploreTab) => void;
    getTab?: () => ExploreTab;
    fetchData?: () => Promise<LoadDataResult>;
    cloudBaseUrl?: string;
}

if (typeof window !== 'undefined') {
    //@ts-ignore
    window.toJS = toJS;
}

// TODO move to a utility class?
function getFilterString(
    selectedFilters: SelectedFilter[],
    unfilteredOptions: MobxPromise<CountByType[]>
) {
    const filterToFieldMap: { [filter: string]: string } = {
        AtlasName: 'atlas_name',
    };

    if (selectedFilters.length > 0) {
        const clauses = _(selectedFilters)
            .groupBy('group')
            .map((val, k) => {
                const field = filterToFieldMap[k] || k;
                // if any of the values are type string, we can assume they all are
                const values = val.map((v) => `'${v.value}'`).join(',');
                if (
                    val.find((v) => {
                        const option = unfilteredOptions.result?.find(
                            (o) => o.val === v.value
                        );
                        return option?.fieldType === 'string';
                    })
                ) {
                    return `${field} in (${values})`;
                } else {
                    return `hasAny(${field},[${values}])`;
                }
            })
            .value();

        return ' WHERE ' + clauses.join(' AND ');
    } else {
        return '';
    }
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
            publicationManifestByUid: {},
            schemaDataById: {},
        };

        makeObservable(this);

        //@ts-ignore
        if (typeof window !== 'undefined') (window as any).me = this;
    }

    unfilteredOptions = new remoteData({
        invoke: async () => {
            return doQuery<CountByType>(
                countsByTypeQuery({ filterString: '' })
            );
        },
    });

    filteredOptions = new remoteData({
        await: () => [this.unfilteredOptions],
        invoke: async () => {
            if (this.filterString === '') {
                return this.unfilteredOptions.result;
            } else {
                const filteredResult = await doQuery<CountByType>(
                    countsByTypeQuery({
                        filterString: this.filterString,
                    })
                );
                const filteredMap = _.keyBy(
                    filteredResult,
                    (option) => option.val + option.type
                );
                const unfilteredMap = _.keyBy(
                    this.unfilteredOptions.result,
                    (option) => option.val + option.type
                );

                return _(unfilteredMap)
                    .mapValues((o, k) => {
                        if (k in filteredMap) {
                            return filteredMap[k];
                        } else {
                            const updated = _.clone(o);
                            updated.count = 0;
                            return updated;
                        }
                    })
                    .values()
                    .value();
            }
        },
    });

    get filterString() {
        const selectedFilters = toJS(this.selectedFilters);
        return getFilterString(selectedFilters, this.unfilteredOptions);
    }

    get filterStringWithoutAtlasFilters() {
        const selectedFilters = toJS(this.selectedFilters).filter(
            (f) => f.group !== AttributeNames.AtlasName
        );
        return getFilterString(selectedFilters, this.unfilteredOptions);
    }

    files = new remoteData<Entity[]>({
        invoke: async () => {
            const q = fileQuery;
            return await doQuery<Entity>(q);
        },
    });

    filesFiltered = new remoteData<Entity[]>({
        await: () => [this.files],
        invoke: async () => {
            if (this.filterString.length === 0) {
                return this.files.result || [];
            } else {
                const q = 'SELECT * FROM files' + this.filterString;
                return await doQuery<Entity>(q);
            }
        },
    });

    cases = new remoteData<Entity[]>({
        invoke: async () => {
            const q = caseQuery({ filterString: '' });
            return await doQuery<Entity>(q);
        },
    });

    casesFiltered = new remoteData<Entity[]>({
        await: () => [],
        invoke: async () => {
            const q = caseQuery({ filterString: this.filterString });
            return await doQuery<Entity>(q);
        },
    });

    specimen = new remoteData<Entity[]>({
        invoke: async () => {
            const q = specimenQuery({ filterString: '' });
            return doQuery<Entity>(q);
        },
    });

    specimenFiltered = new remoteData<Entity[]>({
        invoke: async () => {
            const q = specimenQuery({ filterString: this.filterString });
            return doQuery<Entity>(q);
        },
    });

    atlases = new remoteData<Atlas[]>({
        invoke: async () => {
            const data = await doQuery<Atlas>(atlasQuery({ filterString: '' }));
            data.forEach(
                (atlas: Atlas) =>
                    (atlas.AtlasMeta = JSON.parse(atlas.AtlasMeta.toString()))
            );
            return data;
        },
    });

    get atlasMap() {
        return _.keyBy(this.atlases.result, (a) => a.htan_id);
    }

    async filterAtlases(filterString: string) {
        if (filterString.length === 0) {
            return this.atlases.result || [];
        } else {
            const data = await doQuery<Atlas>(
                atlasQuery({ filterString: filterString })
            );
            data.forEach(
                (atlas: Atlas) =>
                    (atlas.AtlasMeta = JSON.parse(atlas.AtlasMeta.toString()))
            );
            return data;
        }
    }

    atlasesFilteredByNonAtlasFilters = new remoteData<Atlas[]>({
        await: () => [this.atlases],
        invoke: async () =>
            this.filterAtlases(this.filterStringWithoutAtlasFilters),
    });

    atlasesFiltered = new remoteData<Atlas[]>({
        await: () => [this.atlases],
        invoke: async () => this.filterAtlases(this.filterString),
    });

    publications = new remoteData({
        await: () => [this.cases],
        invoke: async () => {
            const q = `

                WITH filteredPublications AS (SELECT DISTINCT publicationId FROM (
                                                                                     SELECT arrayJoin(associatedFiles) as fileId, publicationId FROM publication_manifest
                                                                                     WHERE fileId IN (
                                                                                         SELECT files.DataFileID FROM files 
                                                                                             ${this.filterString}
                                                                                     )
                                                                                 ))
                SELECT *
                FROM filteredPublications fp
                         LEFT JOIN publication_manifest pm on fp.publicationId = pm.publicationId
             `;
            const publications = await doQuery<PublicationManifest>(q);

            _.forEach(publications, (pub: PublicationManifest) => {
                // @ts-ignore (we're fixing this
                pub.AtlasMeta = JSON.parse(pub.AtlasMeta);
            });

            return publications;
        },
    });

    get publicationsById() {
        return _.keyBy(this.publications.result, (p) => p.publicationId);
    }

    @action.bound toggleShowAllBiospecimens() {
        this.showAllBiospecimens = !this.showAllBiospecimens;
    }
    @action.bound toggleShowAllCases() {
        this.showAllCases = !this.showAllCases;
    }

    get selectedFilters(): SelectedFilter[] {
        return this._selectedFilters;
    }

    set selectedFilters(filters: SelectedFilter[]) {
        if (this.props.onFilterChange) {
            this.props.onFilterChange(filters);
        } else {
            this._selectedFilters = filters;
        }
    }

    get groupsByPropertyFiltered() {
        return _(this.groupsByProperty)
            .mapValues((group) =>
                group.filter((g) => parseInt(g.count.toString()) > 0)
            )
            .value();
    }

    get selectedFiltersByAttrName(): ISelectedFiltersByAttrName {
        return getSelectedFiltersByAttrName(this.selectedFilters);
    }

    @action.bound
    setFilter(actionMeta: FilterActionMeta<SelectedFilter>) {
        this.selectedFilters = getNewFilters(this.selectedFilters, actionMeta);
    }

    @observable currentTab: ExploreTab = ExploreTab.ATLAS;

    @action.bound
    getTab(tabId: ExploreTab) {
        return this.currentTab;
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

    get nonAtlasSelectedFiltersByAttrName() {
        return _.omit(this.selectedFiltersByAttrName, [
            AttributeNames.AtlasName,
        ]);
    }

    get groupsByProperty() {
        return _(this.filteredOptions.result).groupBy('type').value();
    }

    render() {
        function allComplete(proms: MobxPromise<any>[]) {
            return _(proms)
                .map((p) => p.isComplete)
                .every();
        }

        const allDataLoaded = allComplete([
            this.casesFiltered,
            this.cases,
            this.specimenFiltered,
            this.specimen,
            this.filteredOptions,
            this.publications,
            this.atlasesFiltered,
            this.filesFiltered,
            this.files,
            this.unfilteredOptions,
            this.atlasesFiltered,
            this.atlasesFilteredByNonAtlasFilters,
        ]);

        // Always render the filter controls, regardless of data loading state
        const filterControls = (
            <>
                <FileFilterControls
                    setFilter={this.setFilter}
                    selectedFiltersByGroupName={this.selectedFiltersByAttrName}
                    selectedFilters={this.selectedFilters}
                    entities={this.filesFiltered.result || []}
                    groupsByProperty={this.groupsByProperty}
                    enableReleaseFilter={
                        this.props.isReleaseQCEnabled
                            ? this.props.isReleaseQCEnabled()
                            : false
                    }
                />

                <Filter
                    setFilter={this.setFilter}
                    selectedFiltersByGroupName={this.selectedFiltersByAttrName}
                    getFilterDisplayName={getFileFilterDisplayName}
                />
            </>
        );

        // If data is still loading, show filter controls with loading indicator
        if (!allDataLoaded) {
            return (
                <div className={styles.explore}>
                    {filterControls}
                    <div className={commonStyles.loadingIndicator}>
                        <ScaleLoader />
                    </div>
                </div>
            );
        } else {
            // All data loaded, show complete UI
            return (
                <div className={styles.explore}>
                    {filterControls}

                    <ExploreSummary
                        summaryData={getDefaultSummaryData(
                            this.casesFiltered.result || [],
                            this.specimenFiltered.result || [],
                            this.filesFiltered.result || [],
                            this.groupsByPropertyFiltered
                        )}
                    />

                    <ExploreTabs
                        setTab={(currentTab: ExploreTab) => {
                            this.currentTab = currentTab;
                        }}
                        filterString={this.filterString}
                        activeTab={this.currentTab}
                        schemaDataById={this.state.schemaDataById}
                        filteredFiles={this.filesFiltered.result || []}
                        filteredSynapseAtlases={
                            this.atlasesFiltered.result || []
                        }
                        filteredSynapseAtlasesByNonAtlasFilters={
                            this.atlasesFilteredByNonAtlasFilters.result || []
                        }
                        atlases={this.atlases}
                        filteredSamples={this.casesFiltered.result || []}
                        cases={this.cases}
                        filteredCases={this.casesFiltered}
                        selectedSynapseAtlases={this.selectedAtlases}
                        allSynapseAtlases={this.atlases.result || []}
                        onSelectAtlas={this.onSelectAtlas}
                        samples={this.specimen}
                        samplesFiltered={this.specimenFiltered}
                        filteredCasesByNonAtlasFilters={
                            // TODO this.filteredCasesByNonAtlasFilters
                            []
                        }
                        filteredSamplesByNonAtlasFilters={
                            // TODO this.filteredSamplesByNonAtlasFilters
                            []
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
                        cloudBaseUrl={this.props.cloudBaseUrl}
                        getAtlasMetaData={
                            this.props.getAtlasMetaData || getAtlasMetaData
                        }
                        genericAttributeMap={HTANToGenericAttributeMap}
                        files={this.files.result!}
                        filteredPublications={this.publications.result!}
                        // TODO these should be unfiltered publications, not filtered
                        publications={this.publications.result!}
                        publicationManifestByUid={this.publicationsById}
                    />
                </div>
            );
        }
    }
}
