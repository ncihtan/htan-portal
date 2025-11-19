'use client';
import _, { Dictionary } from 'lodash';
import remoteData, { MobxPromise } from 'mobxpromise';
import { action, makeObservable, observable, toJS } from 'mobx';
import { observer } from 'mobx-react';
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
    atlasQuery,
    caseQuery,
    commonStyles,
    CountByType,
    countsByTypeQuery,
    defaultCountsByTypeQueryFilterString,
    doQuery,
    Entity,
    fileQuery,
    getCountsByTypeQueryUniformFilterString,
    getFileFilterDisplayName,
    getFilterString,
    LoadDataResult,
    postProcessFiles,
    postProcessPublications,
    PublicationManifest,
    specimenQuery,
} from '@htan/data-portal-commons';
import { AttributeNames } from '@htan/data-portal-utils';

import { ExploreSummary } from './ExploreSummary';
import { ExploreTabs } from './ExploreTabs';
import FileFilterControls from './FileFilterControls';

import { getDefaultSummaryData } from '../lib/helpers';
import { ExploreTab } from '../lib/types';

import styles from './explore.module.scss';

export interface IExploreProps {
    getAtlasMetaData: () => AtlasMetaData;
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

function getFilterStringExcludeSelf(
    selectedFilters: SelectedFilter[],
    unfilteredOptions: MobxPromise<CountByType[]>,
    selfGroup: AttributeNames
) {
    const filters = toJS(selectedFilters).filter((f) => f.group !== selfGroup);

    return getFilterString(filters, unfilteredOptions.result);
}

function groupOptionsByType(
    filteredOptions?: CountByType[]
): Dictionary<CountByType[]> {
    return _(filteredOptions).groupBy('type').value();
}

function getGroupsByPropertyFiltered(
    groupsByProperty: Dictionary<CountByType[]>
): Dictionary<CountByType[]> {
    return _(groupsByProperty)
        .mapValues((group) =>
            group.filter((g) => parseInt(g.count.toString()) > 0)
        )
        .value();
}

@observer
export class Explore extends React.Component<IExploreProps> {
    @observable private showAllBiospecimens = false;
    @observable private showAllCases = false;
    @observable private _selectedFilters: SelectedFilter[] =
        this.props.getSelectedFilters?.() || [];
    @observable private currentTab: ExploreTab =
        this.props.getTab?.() || ExploreTab.ATLAS;

    constructor(props: any) {
        super(props);
        makeObservable(this);
    }

    unfilteredOptions = new remoteData({
        invoke: async () => {
            return doQuery<CountByType>(
                countsByTypeQuery(defaultCountsByTypeQueryFilterString)
            );
        },
    });

    filteredOptionsForSummary = new remoteData({
        await: () => [this.unfilteredOptions],
        invoke: async () => {
            if (this.filterString === '') {
                return this.unfilteredOptions.result;
            } else {
                const filteredCountsByType = await doQuery<CountByType>(
                    countsByTypeQuery(
                        getCountsByTypeQueryUniformFilterString(
                            this.filterString
                        )
                    )
                );

                return this.getOptionsFromFilteredCounts(filteredCountsByType);
            }
        },
    });

    filteredOptions = new remoteData({
        await: () => [this.unfilteredOptions],
        invoke: async () => {
            if (this.filterString === '') {
                return this.unfilteredOptions.result;
            } else {
                const filteredCountsByType = await doQuery<CountByType>(
                    countsByTypeQuery({
                        genderFilterString: this.getFilterStringForAttribute(
                            AttributeNames.Gender
                        ),
                        raceFilterString: this.getFilterStringForAttribute(
                            AttributeNames.Race
                        ),
                        primaryDiagnosisFilterString: this.getFilterStringForAttribute(
                            AttributeNames.PrimaryDiagnosis
                        ),
                        ethnicityFilterString: this.getFilterStringForAttribute(
                            AttributeNames.Ethnicity
                        ),
                        tissueOrOrganOfOriginFilterString: this.getFilterStringForAttribute(
                            AttributeNames.TissueorOrganofOrigin
                        ),
                        levelFilterString: this.getFilterStringForAttribute(
                            AttributeNames.level
                        ),
                        assayNameFilterString: this.getFilterStringForAttribute(
                            AttributeNames.assayName
                        ),
                        treatmentTypeFilterString: this.getFilterStringForAttribute(
                            AttributeNames.TreatmentType
                        ),
                        fileFormatFilterString: this.getFilterStringForAttribute(
                            AttributeNames.FileFormat
                        ),
                        viewersFilterString: this.getFilterStringForAttribute(
                            AttributeNames.viewersArr
                        ),
                        organTypeFilterString: this.getFilterStringForAttribute(
                            AttributeNames.organType
                        ),
                        atlasNameFilterString: this.getFilterStringForAttribute(
                            AttributeNames.AtlasName
                        ),
                        downloadSourceFilterString: this.getFilterStringForAttribute(
                            AttributeNames.downloadSource
                        ),
                        releaseVersionFilterString: this.getFilterStringForAttribute(
                            AttributeNames.releaseVersion
                        ),
                    })
                );

                return this.getOptionsFromFilteredCounts(filteredCountsByType);
            }
        },
    });

    get filterString() {
        const selectedFilters = toJS(this.selectedFilters);
        return getFilterString(selectedFilters, this.unfilteredOptions.result);
    }

    getFilterStringForAttribute(attribute: AttributeNames) {
        return getFilterStringExcludeSelf(
            toJS(this.selectedFilters),
            this.unfilteredOptions,
            attribute
        );
    }

    getOptionsFromFilteredCounts(
        filteredCountsByType: CountByType[]
    ): CountByType[] {
        const filteredMap = _.keyBy(
            filteredCountsByType,
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

    files = new remoteData<Entity[]>({
        invoke: async () => {
            const data = await doQuery<Entity>(fileQuery);
            return postProcessFiles(data);
        },
    });

    filesFiltered = new remoteData<Entity[]>({
        await: () => [this.files, this.unfilteredOptions],
        invoke: async () => {
            if (this.filterString.length === 0) {
                return this.files.result || [];
            } else {
                const q = fileQuery + this.filterString;
                const data = await doQuery<Entity>(q);
                return postProcessFiles(data);
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
        await: () => [this.unfilteredOptions],
        invoke: async () => {
            const q = caseQuery({ filterString: this.filterString });
            return await doQuery<Entity>(q);
        },
    });

    casesFilteredByNonAtlasFilters = new remoteData<Entity[]>({
        await: () => [this.unfilteredOptions],
        invoke: async () => {
            const q = caseQuery({
                filterString: this.getFilterStringForAttribute(
                    AttributeNames.AtlasName
                ),
            });
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
        await: () => [this.unfilteredOptions],
        invoke: async () => {
            const q = specimenQuery({ filterString: this.filterString });
            return doQuery<Entity>(q);
        },
    });

    specimenFilteredByNonAtlasFilters = new remoteData<Entity[]>({
        await: () => [this.unfilteredOptions],
        invoke: async () => {
            const q = specimenQuery({
                filterString: this.getFilterStringForAttribute(
                    AttributeNames.AtlasName
                ),
            });
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
        await: () => [this.atlases, this.unfilteredOptions],
        invoke: async () =>
            this.filterAtlases(
                this.getFilterStringForAttribute(AttributeNames.AtlasName)
            ),
    });

    atlasesFiltered = new remoteData<Atlas[]>({
        await: () => [this.atlases, this.unfilteredOptions],
        invoke: async () => this.filterAtlases(this.filterString),
    });

    publications = new remoteData({
        await: () => [this.cases, this.unfilteredOptions],
        invoke: async () => {
            const publications = await doQuery<PublicationManifest>(
                `SELECT * FROM publication_manifest`
            );

            return postProcessPublications(publications);
        },
    });

    publicationsFiltered = new remoteData({
        await: () => [this.cases, this.unfilteredOptions],
        invoke: async () => {
            const q = `
                WITH filteredPublications AS (
                    SELECT DISTINCT publicationId FROM (
                         SELECT arrayJoin(associatedFiles) as fileId, publicationId
                         FROM publication_manifest
                         WHERE fileId IN (
                             SELECT files.DataFileID FROM files 
                                 ${this.filterString}
                         )
                     )
                )
                SELECT *
                FROM filteredPublications fp
                    LEFT JOIN publication_manifest pm on fp.publicationId = pm.publicationId
             `;
            const publications = await doQuery<PublicationManifest>(q);

            return postProcessPublications(publications);
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
        }

        this._selectedFilters = filters;
    }

    get groupsByPropertyFiltered() {
        return getGroupsByPropertyFiltered(this.groupsByProperty);
    }

    get groupsByPropertyFilteredForSummary() {
        return getGroupsByPropertyFiltered(this.groupsByPropertyForSummary);
    }

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

        const newFiltersByAttribute = getSelectedFiltersByAttrName(newFilters);
        const newAtlasFilters = newFiltersByAttribute[AttributeNames.AtlasName];
        const currentAtlasFilters = this.selectedFiltersByAttrName[
            AttributeNames.AtlasName
        ];

        // update selected filters if only selected atlas filters actually change
        if (!_.isEqual(newAtlasFilters, currentAtlasFilters)) {
            this.selectedFilters = newFilters;
        }
    }

    get selectedAtlases() {
        const atlasFilters = this.selectedFiltersByAttrName[
            AttributeNames.AtlasName
        ];

        if (_.size(atlasFilters) > 0) {
            return _.chain(this.filesFiltered.result)
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
        return groupOptionsByType(this.filteredOptions.result);
    }

    get groupsByPropertyForSummary() {
        return groupOptionsByType(this.filteredOptionsForSummary.result);
    }

    render() {
        function allComplete(proms: MobxPromise<any>[]) {
            return _(proms)
                .map((p) => p.isComplete)
                .every();
        }

        const allDataLoaded = allComplete([
            this.casesFilteredByNonAtlasFilters,
            this.casesFiltered,
            this.cases,
            this.specimenFilteredByNonAtlasFilters,
            this.specimenFiltered,
            this.specimen,
            this.filteredOptions,
            this.filteredOptionsForSummary,
            this.unfilteredOptions,
            this.publications,
            this.publicationsFiltered,
            this.atlases,
            this.atlasesFiltered,
            this.atlasesFilteredByNonAtlasFilters,
            this.filesFiltered,
            this.files,
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
                            this.groupsByPropertyFilteredForSummary,
                            (val: any, key: string) => val.val
                        )}
                    />

                    <ExploreTabs
                        setTab={(currentTab: ExploreTab) => {
                            this.currentTab = currentTab;
                        }}
                        filterString={this.filterString}
                        activeTab={this.currentTab}
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
                        casesFiltered={this.casesFiltered}
                        selectedSynapseAtlases={this.selectedAtlases}
                        allSynapseAtlases={this.atlases.result || []}
                        onSelectAtlas={this.onSelectAtlas}
                        samples={this.specimen}
                        samplesFiltered={this.specimenFiltered}
                        filteredCasesByNonAtlasFilters={
                            this.casesFilteredByNonAtlasFilters
                        }
                        filteredSamplesByNonAtlasFilters={
                            this.specimenFilteredByNonAtlasFilters
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
                        getAtlasMetaData={this.props.getAtlasMetaData}
                        files={this.files.result!}
                        filteredPublications={this.publicationsFiltered.result!}
                        publications={this.publications.result!}
                        publicationManifestByUid={this.publicationsById}
                    />
                </div>
            );
        }
    }
}
