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
    PublicationSummary,
} from '@htan/data-portal-commons';
import { AttributeNames } from '@htan/data-portal-utils';
import { DataSchemaData } from '@htan/data-portal-schema';

import { ExploreSummary } from './ExploreSummary';
import { ExploreTabs } from './ExploreTabs';
import { getDefaultSummaryData } from '../lib/helpers';
import { ExploreTab } from '../lib/types';

import styles from './explore.module.scss';
import {
    caseQuery,
    doQuery,
    myQuery,
    specimenQuery,
} from '../../../../lib/clickhouseStore.ts';

export interface IExploreState {
    files: Entity[];
    filters: { [key: string]: string[] };
    schemaDataById?: { [schemaDataId: string]: DataSchemaData };
    atlases: Atlas[];
    publicationManifestByUid: { [uid: string]: PublicationManifest };
    publicationSummaryByPubMedID?: { [pubMedId: string]: PublicationSummary };
    atlasData?: any;
}

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

@observer
export class Explore2 extends React.Component<IExploreProps, IExploreState> {
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
            publicationSummaryByPubMedID: {},
            schemaDataById: {},
        };

        makeObservable(this);

        //@ts-ignore
        if (typeof window !== 'undefined') (window as any).me = this;
    }

    unfilteredOptions = new remoteData({
        invoke: async () => {
            return doQuery(myQuery);
        },
    });

    get filterString() {
        const selectedFilters = toJS(this.selectedFilters);
        if (selectedFilters.length > 0) {
            const clauses = _(selectedFilters)
                .groupBy('group')
                .map((val, k) => {
                    const values = val.map((v) => `'${v.value}'`).join(',');
                    return `hasAny(${k},[${values}])`;
                })
                .value();

            return ' WHERE ' + clauses.join(' AND ');
        } else {
            return '';
        }
    }

    files = new remoteData({
        invoke: async () => {
            const q = 'SELECT * FROM files' + this.filterString;
            const files = await doQuery(q);
            return files;
        },
    });

    cases = new remoteData({
        invoke: async () => {
            const q = caseQuery({ filterString: '' });
            const cases = await doQuery(q);
            return cases;
        },
    });

    casesFiltered = new remoteData({
        await: () => [],
        invoke: async () => {
            const q = caseQuery({ filterString: this.filterString });
            return await doQuery(q);
        },
    });

    specimen = new remoteData({
        invoke: async () => {
            // const q = `SELECT * FROM biospecimen c
            //            WHERE biospecimen.ParentID IN (
            //                SELECT demographicsIds as moo FROM files f
            //                ARRAY JOIN demographicsIds
            //          ${this.filterString}
            // )`;
            const q = specimenQuery({ filterString: '' });
            return doQuery(q);
        },
    });

    specimenFiltered = new remoteData({
        invoke: async () => {
            const q = specimenQuery({ filterString: this.filterString });
            return doQuery(q);
        },
    });

    atlases = new remoteData({
        invoke: async () => {
            const q = `
            SELECT * FROM atlases 
                WHERE htan_id IN (
                       SELECT files.atlasid FROM files 
                )
            `;

            return doQuery(q);
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

            // const withPub = this.cases.result!.reduce((agg, c)=>{
            //     c.publicationIds.forEach((publicationId)=>{
            //         agg[publicationId] = agg[publicationId] || [];
            //         agg[publicationId].push(c);
            //     });
            //     return agg;
            // },{});

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

    // get groupsByProperty() {
    //     return groupFilesByAttrNameAndValue(this.state.files);
    // }

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

    get filteredFilesByNonAtlasFilters() {
        return filterFiles(
            this.nonAtlasSelectedFiltersByAttrName,
            this.state.files
        );
    }

    get samples() {
        return getFilteredSamples(this.state.files, this.cases, false);
    }

    get filteredSamples() {
        return getFilteredSamples(
            this.filteredFiles,
            this.filteredCases,
            this.showAllBiospecimens
        );
    }

    get filteredSamplesByNonAtlasFilters() {
        return getFilteredSamples(
            this.filteredFilesByNonAtlasFilters,
            this.filteredCasesByNonAtlasFilters,
            this.showAllBiospecimens
        );
    }

    // get cases() {
    //     return getFilteredCases(this.state.files, {}, true);
    // }

    get filteredCases() {
        return getFilteredCases(
            this.filteredFiles,
            this.selectedFiltersByAttrName,
            this.showAllCases
        );
    }

    get filteredCasesByNonAtlasFilters() {
        return getFilteredCases(
            this.filteredFilesByNonAtlasFilters,
            this.nonAtlasSelectedFiltersByAttrName,
            this.showAllCases
        );
    }

    get filteredPublications() {
        return _(this.filteredCases)
            .flatMap((c) => c.publicationIds)
            .compact()
            .uniq()
            .map((id) => this.state.publicationManifestByUid[id])
            .value();
    }

    get atlasMap() {
        return _.keyBy(this.state.atlases, (a) => a.htan_id);
    }

    get filteredAtlases() {
        // get only atlases associated with filtered files
        return _.chain(this.filteredFiles)
            .map((f) => f.atlasid)
            .uniq()
            .map((id) => this.atlasMap[id])
            .value();
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

    get allAtlases() {
        return _.chain(this.state.files)
            .map((f) => f.atlasid)
            .uniq()
            .map((id) => this.atlasMap[id])
            .value();
    }

    get groupsByProperty() {
        const groupsByProperty = _(this.unfilteredOptions.result)
            .groupBy('type')
            .value();
        return groupsByProperty;
    }

    get publicationsById() {
        return _.keyBy(this.publications.result!, 'publicationId');
    }

    render() {
        function allComplete(proms: MobxPromise<any>[]) {
            return _.every(proms, (p) => p.isComplete);
        }

        if (
            allComplete([
                this.casesFiltered,
                this.cases,
                this.specimenFiltered,
                this.specimen,
                this.unfilteredOptions,
            ]) === false
        ) {
            return (
                <div className={commonStyles.loadingIndicator}>
                    <ScaleLoader />
                </div>
            );
        } else {
            const filterControlsProps: IGenericFilterControlProps<any, any> = {
                countHeader: 'Files',
                attributeMap: FileAttributeMap,
                attributeNames: [
                    AttributeNames.AtlasName,
                    AttributeNames.TissueorOrganofOrigin,
                    AttributeNames.PrimaryDiagnosis,
                    AttributeNames.assayName,
                    AttributeNames.Level,
                    AttributeNames.FileFormat,
                    AttributeNames.TreatmentType,
                ],
                entities: [],
                setFilter: this.setFilter,
                selectedFiltersByGroupName: {},
                selectedFilters: [],
                groupsByProperty: this.groupsByProperty,
            };

            const options = (str: string) => {
                if (str in this.groupsByProperty) {
                    return _.map(this.groupsByProperty[str], (val, key) => {
                        return {
                            value: val.val,
                            label: val.val,
                            group: str,
                            isSelected: false,
                            count: val.count,
                        };
                    });
                } else {
                    return [];
                }

                // return [{
                //         value: "string",
                //         label: "fdsafdsa",
                //         group: "TissueorOrganofOrigin",
                //         count: 5,
                //         isSelected: false
                //     }];
            };

            const dropdownProps = {
                options,
                countHeader: filterControlsProps.countHeader,
                setFilter: filterControlsProps.setFilter,
                selectedFiltersByGroupName:
                    filterControlsProps.selectedFiltersByGroupName,
                attributeMap: FileAttributeMap,
            };

            return (
                <div className={styles.explore}>
                    <FilterControls {...filterControlsProps}>
                        <FilterDropdown
                            {...dropdownProps}
                            attributes={[AttributeNames.TissueorOrganofOrigin]}
                            className={styles.filterCheckboxListContainer}
                            width={120}
                        />

                        <FilterDropdown
                            {...dropdownProps}
                            placeholder="Demographics"
                            attributes={[
                                AttributeNames.Gender,
                                AttributeNames.Race,
                                AttributeNames.Ethnicity,
                            ]}
                            className={styles.filterCheckboxListContainer}
                            width={164}
                        />

                        <FilterDropdown
                            {...dropdownProps}
                            placeholder="Disease"
                            attributes={[AttributeNames.PrimaryDiagnosis]}
                            className={styles.filterCheckboxListContainer}
                            width={164}
                        />

                        <FilterDropdown
                            {...dropdownProps}
                            placeholder="Assay"
                            attributes={[AttributeNames.assayName]}
                            className={styles.filterCheckboxListContainer}
                            width={164}
                        />

                        <FilterDropdown
                            {...dropdownProps}
                            placeholder="File"
                            attributes={[
                                AttributeNames.Level,
                                AttributeNames.FileFormat,
                            ]}
                            className={styles.filterCheckboxListContainer}
                            width={164}
                        />

                        {/*<FilterDropdown*/}
                        {/*    {...dropdownProps}*/}
                        {/*    placeholder="Viewer"*/}
                        {/*    attributes={[*/}
                        {/*        AttributeNames.viewers*/}
                        {/*    ]}*/}
                        {/*    className={styles.filterCheckboxListContainer}*/}
                        {/*    width={164}*/}
                        {/*/>*/}
                    </FilterControls>

                    <Filter
                        setFilter={this.setFilter}
                        selectedFiltersByGroupName={toJS(
                            this.selectedFiltersByAttrName
                        )}
                        getFilterDisplayName={getFileFilterDisplayName}
                    />

                    <ExploreSummary
                        summaryData={getDefaultSummaryData(
                            this.cases.result!,
                            [],
                            this.files.result!,
                            [] //this.groupsByPropertyFiltered
                        )}
                    />

                    <ExploreTabs
                        setTab={(currentTab: ExploreTab) => {
                            this.currentTab = currentTab;
                        }}
                        activeTab={this.currentTab}
                        schemaDataById={this.state.schemaDataById}
                        files={this.state.files}
                        filteredFiles={this.files.result}
                        filteredSynapseAtlases={this.filteredAtlases}
                        filteredSynapseAtlasesByNonAtlasFilters={
                            this.filteredAtlasesByNonAtlasFilters
                        }
                        atlases={this.atlases}
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
                        getAtlasMetaData={this.props.getAtlasMetaData}
                        publicationManifestByUid={this.publicationsById}
                        publicationSummaryByPubMedID={
                            this.state.publicationSummaryByPubMedID
                        }
                        publications={this.publications.result!}
                        filteredPublications={this.filteredPublications}
                        genericAttributeMap={HTANToGenericAttributeMap} // TODO needs to be configurable, different mappings for each portal
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
