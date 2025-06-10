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
    FilterControls,
    FilterDropdown,
    getNewFilters,
    getSelectedFiltersByAttrName,
    IGenericFilterControlProps,
    ISelectedFiltersByAttrName,
    SelectedFilter,
} from '@htan/data-portal-filter';
import {
    Atlas,
    AtlasMetaData,
    commonStyles,
    Entity,
    FileAttributeMap,
    filterFiles,
    getFileFilterDisplayName,
    getFilteredCases,
    getFilteredSamples,
    groupFilesByAttrNameAndValue,
    HTANToGenericAttributeMap,
    LoadDataResult,
    PublicationManifest,
} from '@htan/data-portal-commons';
import { AttributeNames } from '@htan/data-portal-utils';
import { DataSchemaData } from '@htan/data-portal-schema';

import { ExploreSummary } from './ExploreSummary';
import { ExploreTabs } from './ExploreTabs';
import { getDefaultSummaryData } from '../lib/helpers';
import { ExploreTab } from '../lib/types';

import styles from './explore.module.scss';
import {
    atlasQuery,
    caseQuery,
    doQuery,
    fileQuery,
    countsByTypeQuery,
    specimenQuery,
} from '../../../../lib/clickhouseStore.ts';
import FileFilterControls from './FileFilterControls.tsx';
import getAtlasMetaData from '../../../../lib/getAtlasMetaData.ts';

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
    window.toJS = toJS;
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
            return doQuery(countsByTypeQuery({ filterString: '' }));
        },
    });

    filteredOptions = new remoteData({
        await: () => [this.unfilteredOptions],
        invoke: async () => {
            if (this.filterString === '') {
                return this.unfilteredOptions.result;
            } else {
                const filteredResult = await doQuery(
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
                const moo = _(unfilteredMap)
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
                return moo;
            }
        },
    });

    get filterString() {
        const selectedFilters = toJS(this.selectedFilters);
        if (selectedFilters.length > 0) {
            const clauses = _(selectedFilters)
                .groupBy('group')
                .map((val, k) => {
                    // if any of the values are type string, we can assume they all are
                    const values = val.map((v) => `'${v.value}'`).join(',');
                    if (val.find((v) => v.fieldType === 'string')) {
                        return `${k} in (${values})`;
                    } else {
                        return `hasAny(${k},[${values}])`;
                    }
                })
                .value();

            return ' WHERE ' + clauses.join(' AND ');
        } else {
            return '';
        }
    }

    files = new remoteData({
        invoke: async () => {
            const q = fileQuery;
            const files = await doQuery(q);
            return files;
        },
    });

    filesFiltered = new remoteData<Entity[]>({
        await: () => [this.files],
        invoke: async () => {
            if (this.filterString.length === 0) {
                return this.files.result;
            } else {
                const q = 'SELECT * FROM files' + this.filterString;
                const files = await doQuery(q);
                return files;
            }
        },
    });

    cases = new remoteData<Entity[]>({
        invoke: async () => {
            const q = caseQuery({ filterString: '' });
            const cases = await doQuery(q);
            return cases;
        },
    });

    casesFiltered = new remoteData<Entity[]>({
        await: () => [],
        invoke: async () => {
            const q = caseQuery({ filterString: this.filterString });
            return await doQuery(q);
        },
    });

    specimen = new remoteData<Entity[]>({
        invoke: async () => {
            const q = specimenQuery({ filterString: '' });
            return doQuery(q);
        },
    });

    specimenFiltered = new remoteData<Entity[]>({
        invoke: async () => {
            const q = specimenQuery({ filterString: this.filterString });
            return doQuery(q);
        },
    });

    atlases = new remoteData<Atlas[]>({
        invoke: async () => {
            const data = await doQuery<Atlas>(atlasQuery({ filterString: '' }));
            data.forEach(
                (atlas: Atlas) =>
                    (atlas.AtlasMeta = JSON.parse(atlas.AtlasMeta))
            );
            return data;
        },
    });

    atlasesFiltered = new remoteData<Atlas[]>({
        await: () => [this.atlases],
        invoke: async () => {
            if (this.filterString.length === 0) {
                return this.atlases.result;
            } else {
                const data = await doQuery<Atlas>(
                    atlasQuery({ filterString: this.filterString })
                );
                data.forEach(
                    // @ts-ignore
                    (atlas: Atlas) =>
                        (atlas.AtlasMeta = JSON.parse(atlas.AtlasMeta))
                );
                return data;
            }
        },
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
            const publications = await doQuery(q);

            _.forEach(publications, (pub: PublicationManifest) => {
                // @ts-ignore (we're fixing this
                pub.AtlasMeta = JSON.parse(pub.AtlasMeta);
            });

            return publications;
        },
    });

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
        return groupFilesByAttrNameAndValue(this.filteredFiles);
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

    get filteredFiles() {
        return filterFiles(this.selectedFiltersByAttrName, this.state.files);
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

    get filteredAtlasesByNonAtlasFilters() {
        const filtersExceptAtlasFilters = this
            .nonAtlasSelectedFiltersByAttrName;

        return _.chain(filterFiles(filtersExceptAtlasFilters, this.state.files))
            .map((f) => f.atlasid)
            .uniq()
            .map((id) => this.atlasMap[id])
            .value();
    }

    get groupsByProperty() {
        const groupsByProperty = _(this.filteredOptions.result)
            .groupBy('type')
            .value();
        return groupsByProperty;
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

                    <ExploreTabs
                        setTab={(currentTab: ExploreTab) => {
                            this.currentTab = currentTab;
                        }}
                        filterString={this.filterString}
                        activeTab={this.currentTab}
                        schemaDataById={this.state.schemaDataById}
                        filteredFiles={this.filesFiltered.result}
                        filteredSynapseAtlases={this.filteredAtlases}
                        filteredSynapseAtlasesByNonAtlasFilters={
                            this.filteredAtlasesByNonAtlasFilters
                        }
                        atlases={this.atlases}
                        atlasesFiltered={this.atlasesFiltered}
                        filteredSamples={this.filteredSamples}
                        cases={this.cases}
                        filteredCases={this.casesFiltered}
                        selectedSynapseAtlases={this.selectedAtlases}
                        allSynapseAtlases={this.allAtlases}
                        onSelectAtlas={this.onSelectAtlas}
                        samples={this.specimen}
                        samplesFiltered={this.specimenFiltered}
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
                        cloudBaseUrl={this.props.cloudBaseUrl}
                        getAtlasMetaData={
                            this.props.getAtlasMetaData || getAtlasMetaData
                        }
                        publications={this.publications.result!}
                        filteredPublications={this.filteredPublications}
                        genericAttributeMap={HTANToGenericAttributeMap}
                    />
                </div>
            );
        }
    }
}

function writeCell(value: string) {
    if (_.isArray(value)) {
        return <td>{truncate(value.slice(0, 3).join(', '))}</td>;
    } else {
        return <td>{value}</td>;
    }
}

function truncate(val: string) {
    return val.length > 50 ? val.substr(0, 50) + '...' : val;
}
