'use client';
import _ from 'lodash';
import remoteData from 'mobxpromise';
import {
    action,
    computed,
    makeObservable,
    observable,
    runInAction,
    toJS,
} from 'mobx';
import { observer } from 'mobx-react';
import { fromPromise, IPromiseBasedObservable } from 'mobx-utils';
import { ScaleLoader } from 'react-spinners';
import React from 'react';
import {
    Filter,
    FilterActionMeta,
    FilterControls,
    FilterDropdown,
    getDropdownOptionsFromProps,
    getNewFilters,
    getOptionsFromProps,
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
    fetchDefaultSynData,
    FileAttributeMap,
    fillInEntities,
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
import {
    DataSchemaData,
    fetchAndProcessSchemaData,
} from '@htan/data-portal-schema';

import { ExploreSummary } from './ExploreSummary';
import { ExploreTabs } from './ExploreTabs';
import { FileFilterControls } from './FileFilterControls';
import { getDefaultSummaryData } from '../lib/helpers';
import { ExploreTab } from '../lib/types';

import styles from './explore.module.scss';
import { doQuery, myQuery } from '../../../../lib/clickhouseStore.ts';

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

    files = new remoteData({
        invoke: async () => {
            console.log('here i am');

            let filterString = '';

            const selectedFilters = toJS(this.selectedFilters);

            if (selectedFilters.length > 0) {
                const clauses = _(selectedFilters)
                    .groupBy('group')
                    .map((val, k) => {
                        const values = val.map((v) => `'${v.value}'`).join(',');
                        return `hasAny(${k},[${values}])`;
                    })
                    .value();

                filterString = ' WHERE ' + clauses.join(' AND ');

                console.log('clauses', clauses);
            }

            const q = 'SELECT * FROM files' + filterString;

            console.log('', q);

            return doQuery(q);
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
    get samples() {
        return getFilteredSamples(this.state.files, this.cases, false);
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
    get cases() {
        return getFilteredCases(this.state.files, {}, true);
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

    @computed get filteredPublications() {
        return _(this.filteredCases)
            .flatMap((c) => c.publicationIds)
            .compact()
            .uniq()
            .map((id) => this.state.publicationManifestByUid[id])
            .value();
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

    @computed
    get groupsByProperty() {
        const groupsByProperty = _(this.unfilteredOptions.result)
            .groupBy('type')
            .value();
        return groupsByProperty;
    }

    render() {
        //console.log("goo", toJS(this.selectedFilters));

        console.log(this.files.result);

        if (!this.unfilteredOptions.isComplete) {
            return <div>Loading</div>;
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
                <>
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
                    </FilterControls>

                    <Filter
                        setFilter={this.setFilter}
                        selectedFiltersByGroupName={toJS(
                            this.selectedFiltersByAttrName
                        )}
                        getFilterDisplayName={getFileFilterDisplayName}
                    />
                </>
            );
        }
    }
}
