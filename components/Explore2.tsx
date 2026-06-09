'use client';
import React, { useEffect, useMemo, useState } from 'react';
import { ScaleLoader } from 'react-spinners';

import {
    caseQuery2,
    CountByType,
    countsByTypeQuery2,
    defaultCountsByTypeQueryFilterString,
    doQuery,
    fileQuery2,
    getFilterString2,
    getPhase2Client,
    specimenQuery2,
} from '@htan/data-portal-commons';
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
import { IAttributeInfo } from '@htan/data-portal-utils';
import {
    EnhancedDataTable,
    getDefaultDataTableStyle,
    IEnhancedDataTableColumn,
} from '@htan/data-portal-table';
import { ExploreSummary, ExploreTab } from '@htan/data-portal-explore';

export interface IExplore2Props {
    getAtlasMetaData: () => any;
    onFilterChange?: (selectedFilters: any[]) => void;
    getSelectedFilters?: () => any[];
    isReleaseQCEnabled?: () => boolean;
    setTab?: (tab: string) => void;
    getTab?: () => string;
}

// ─── Phase 2 Attribute Names ─────────────────────────────────────────────────
// Must exactly match the `type` values returned by countsByTypeQuery2.
export enum Phase2AttributeNames {
    AtlasName = 'AtlasName',
    SEX = 'SEX',
    RACE = 'RACE',
    ETHNIC_GROUP = 'ETHNIC_GROUP',
    PRIMARY_DIAGNOSIS_NCI_THESAURUS_ID = 'PRIMARY_DIAGNOSIS_NCI_THESAURUS_ID',
    TISSUE_OR_ORGAN_OF_ORIGIN_UBERON_CODE = 'TISSUE_OR_ORGAN_OF_ORIGIN_UBERON_CODE',
    TREATMENT_TYPE = 'TREATMENT_TYPE',
    assayName = 'assayName',
    level = 'level',
    FileFormat = 'FileFormat',
}

type TableRow = Record<string, any>;

type AtlasSummaryRow = {
    atlas_name: string;
    caseCount: number;
    biospecimenCount: number;
    fileCount: number;
};

// ─── Phase 2 Attribute Map ────────────────────────────────────────────────────
const Phase2AttributeMap: {
    [attr in Phase2AttributeNames]: IAttributeInfo<TableRow>;
} = {
    [Phase2AttributeNames.AtlasName]: {
        path: 'atlas_name',
        displayName: 'Atlas',
    },
    [Phase2AttributeNames.TISSUE_OR_ORGAN_OF_ORIGIN_UBERON_CODE]: {
        path: 'TISSUE_OR_ORGAN_OF_ORIGIN_UBERON_CODE',
        displayName: 'Organ',
    },
    [Phase2AttributeNames.PRIMARY_DIAGNOSIS_NCI_THESAURUS_ID]: {
        path: 'PRIMARY_DIAGNOSIS_NCI_THESAURUS_ID',
        displayName: 'Disease',
    },
    [Phase2AttributeNames.SEX]: { path: 'SEX', displayName: 'Sex' },
    [Phase2AttributeNames.RACE]: { path: 'RACE', displayName: 'Race' },
    [Phase2AttributeNames.ETHNIC_GROUP]: {
        path: 'ETHNIC_GROUP',
        displayName: 'Ethnicity',
    },
    [Phase2AttributeNames.TREATMENT_TYPE]: {
        path: 'TREATMENT_TYPE',
        displayName: 'Treatment',
    },
    [Phase2AttributeNames.assayName]: {
        path: 'assayName',
        displayName: 'Assay',
    },
    [Phase2AttributeNames.level]: { path: 'level', displayName: 'Level' },
    [Phase2AttributeNames.FileFormat]: {
        path: 'FileFormat',
        displayName: 'File Format',
    },
};

// ─── Column definitions ───────────────────────────────────────────────────────
function formatValue(value: unknown) {
    if (Array.isArray(value)) return value.join(', ');
    return value == null ? '' : String(value);
}

const FILE_COLUMNS: IEnhancedDataTableColumn<TableRow>[] = [
    {
        name: 'HTAN_DATA_FILE_ID',
        selector: 'HTAN_DATA_FILE_ID',
        sortable: true,
    },
    { name: 'atlas_name', selector: 'atlas_name', sortable: true },
    { name: 'level', selector: 'level', sortable: true },
    { name: 'assayName', selector: 'assayName', sortable: true },
    { name: 'Filename', selector: 'Filename', sortable: true },
    { name: 'FileFormat', selector: 'FileFormat', sortable: true },
    { name: 'synapseId', selector: 'synapseId', sortable: true },
    {
        name: 'HTAN_PARENT_ID',
        selector: (row) => row.HTAN_PARENT_ID ?? row.ParentDataFileID,
        getSearchValue: (row) => row.HTAN_PARENT_ID ?? row.ParentDataFileID,
        sortable: true,
        omit: true,
    },
    {
        name: 'biospecimenIds',
        selector: (row) => formatValue(row.biospecimenIds),
        getSearchValue: (row) => formatValue(row.biospecimenIds),
        sortable: true,
    },
    {
        name: 'SEX',
        selector: (row) => formatValue(row.SEX),
        getSearchValue: (row) => formatValue(row.SEX),
        sortable: true,
    },
    {
        name: 'ETHNIC_GROUP',
        selector: (row) => formatValue(row.ETHNIC_GROUP),
        getSearchValue: (row) => formatValue(row.ETHNIC_GROUP),
        sortable: true,
    },
    {
        name: 'RACE',
        selector: (row) => formatValue(row.RACE),
        getSearchValue: (row) => formatValue(row.RACE),
        sortable: true,
    },
    {
        name: 'VITAL_STATUS',
        selector: (row) => formatValue(row.VITAL_STATUS),
        getSearchValue: (row) => formatValue(row.VITAL_STATUS),
        sortable: true,
    },
    {
        name: 'TREATMENT_TYPE',
        selector: (row) => formatValue(row.TREATMENT_TYPE),
        getSearchValue: (row) => formatValue(row.TREATMENT_TYPE),
        sortable: true,
    },
    {
        name: 'PRIMARY_DIAGNOSIS_NCI_THESAURUS_ID',
        selector: (row) => formatValue(row.PRIMARY_DIAGNOSIS_NCI_THESAURUS_ID),
        getSearchValue: (row) =>
            formatValue(row.PRIMARY_DIAGNOSIS_NCI_THESAURUS_ID),
        sortable: true,
    },
    {
        name: 'TISSUE_OR_ORGAN_OF_ORIGIN_UBERON_CODE',
        selector: (row) =>
            formatValue(row.TISSUE_OR_ORGAN_OF_ORIGIN_UBERON_CODE),
        getSearchValue: (row) =>
            formatValue(row.TISSUE_OR_ORGAN_OF_ORIGIN_UBERON_CODE),
        sortable: true,
    },
    { name: 'Component', selector: 'Component', sortable: true },
];

const CASE_COLUMNS: IEnhancedDataTableColumn<TableRow>[] = [
    {
        name: 'HTAN_PARTICIPANT_ID',
        selector: 'HTAN_PARTICIPANT_ID',
        sortable: true,
    },
    { name: 'atlas_name', selector: 'atlas_name', sortable: true },
    { name: 'SEX', selector: 'SEX', sortable: true },
    { name: 'ETHNIC_GROUP', selector: 'ETHNIC_GROUP', sortable: true },
    { name: 'RACE', selector: 'RACE', sortable: true },
    { name: 'VITAL_STATUS', selector: 'VITAL_STATUS', sortable: true },
    {
        name: 'AGE_IN_DAYS_AT_DIAGNOSIS',
        selector: 'AGE_IN_DAYS_AT_DIAGNOSIS',
        sortable: true,
    },
    {
        name: 'PRIMARY_DIAGNOSIS_NCI_THESAURUS_ID',
        selector: 'PRIMARY_DIAGNOSIS_NCI_THESAURUS_ID',
        sortable: true,
    },
    {
        name: 'TISSUE_OR_ORGAN_OF_ORIGIN_UBERON_CODE',
        selector: 'TISSUE_OR_ORGAN_OF_ORIGIN_UBERON_CODE',
        sortable: true,
    },
    { name: 'TUMOR_GRADE', selector: 'TUMOR_GRADE', sortable: true },
    {
        name: 'TREATMENT_TYPE',
        selector: (row) => formatValue(row.TREATMENT_TYPE),
        getSearchValue: (row) => formatValue(row.TREATMENT_TYPE),
        sortable: true,
    },
    { name: 'CAUSE_OF_DEATH', selector: 'CAUSE_OF_DEATH', sortable: true },
    {
        name: 'MOLECULAR_ANALYSIS_METHOD',
        selector: 'MOLECULAR_ANALYSIS_METHOD',
        sortable: true,
        omit: true,
    },
    {
        name: 'GENE_SYMBOL',
        selector: 'GENE_SYMBOL',
        sortable: true,
        omit: true,
    },
    {
        name: 'TEST_RESULT',
        selector: 'TEST_RESULT',
        sortable: true,
        omit: true,
    },
    {
        name: 'Component',
        selector: 'Component',
        sortable: true,
        omit: true,
    },
];

const SPECIMEN_COLUMNS: IEnhancedDataTableColumn<TableRow>[] = [
    {
        name: 'HTAN_BIOSPECIMEN_ID',
        selector: 'HTAN_BIOSPECIMEN_ID',
        sortable: true,
    },
    {
        name: 'HTAN_PARTICIPANT_ID',
        selector: 'HTAN_PARTICIPANT_ID',
        sortable: true,
    },
    { name: 'atlas_name', selector: 'atlas_name', sortable: true },
    {
        name: 'HTAN_PARENT_ID',
        selector: (row) => row.HTAN_PARENT_ID ?? row.ParentID,
        getSearchValue: (row) => row.HTAN_PARENT_ID ?? row.ParentID,
        sortable: true,
    },
    {
        name: 'BIOSPECIMEN_TYPE',
        selector: (row) => row.BIOSPECIMEN_TYPE ?? row.BiospecimenType,
        getSearchValue: (row) => row.BIOSPECIMEN_TYPE ?? row.BiospecimenType,
        sortable: true,
    },
    {
        name: 'ACQUISITION_METHOD_TYPE',
        selector: (row) =>
            row.ACQUISITION_METHOD_TYPE ?? row.AcquisitionMethodType,
        getSearchValue: (row) =>
            row.ACQUISITION_METHOD_TYPE ?? row.AcquisitionMethodType,
        sortable: true,
    },
    {
        name: 'PRESERVATION_MEDIUM',
        selector: (row) => row.PRESERVATION_MEDIUM ?? row.StorageMethod,
        getSearchValue: (row) => row.PRESERVATION_MEDIUM ?? row.StorageMethod,
        sortable: true,
    },
    {
        name: 'PRESERVATION_METHOD',
        selector: (row) => row.PRESERVATION_METHOD,
        getSearchValue: (row) => row.PRESERVATION_METHOD,
        sortable: true,
        omit: true,
    },
    {
        name: 'Component',
        selector: 'Component',
        sortable: true,
        omit: true,
    },
];

const ATLAS_COLUMNS: IEnhancedDataTableColumn<AtlasSummaryRow>[] = [
    { name: 'atlas_name', selector: 'atlas_name', sortable: true },
    { name: 'Cases', selector: 'caseCount', sortable: true, right: true },
    {
        name: 'Biospecimens',
        selector: 'biospecimenCount',
        sortable: true,
        right: true,
    },
    { name: 'Files', selector: 'fileCount', sortable: true, right: true },
];

// ─── Sub-table wrapper ────────────────────────────────────────────────────────
function Phase2Table({
    data,
    columns,
    defaultSortField,
}: {
    data: TableRow[];
    columns: IEnhancedDataTableColumn<TableRow>[];
    defaultSortField: string;
}) {
    return (
        <EnhancedDataTable
            columns={columns}
            data={data}
            defaultSortField={defaultSortField}
            striped={true}
            dense={false}
            noHeader={true}
            pagination={true}
            paginationPerPage={25}
            paginationRowsPerPageOptions={[10, 25, 50, 100]}
            customStyles={getDefaultDataTableStyle()}
        />
    );
}

function AtlasSummaryTable({ data }: { data: AtlasSummaryRow[] }) {
    return (
        <EnhancedDataTable
            columns={ATLAS_COLUMNS}
            data={data}
            defaultSortField="atlas_name"
            striped={true}
            dense={false}
            noHeader={true}
            pagination={true}
            paginationPerPage={25}
            paginationRowsPerPageOptions={[10, 25, 50, 100]}
            customStyles={getDefaultDataTableStyle()}
        />
    );
}

// ─── Phase 2 filter controls component ───────────────────────────────────────
// Mirrors FileFilterControls but uses Phase2AttributeNames.
function Phase2FilterControls({
    selectedFilters,
    selectedFiltersByGroupName,
    groupsByProperty,
    setFilter,
}: {
    selectedFilters: SelectedFilter[];
    selectedFiltersByGroupName: ISelectedFiltersByAttrName;
    groupsByProperty: Record<string, CountByType[]>;
    setFilter: (actionMeta: FilterActionMeta<SelectedFilter>) => void;
}) {
    const filterControlsProps: IGenericFilterControlProps<
        TableRow,
        Phase2AttributeNames
    > = {
        countHeader: 'Files',
        attributeMap: Phase2AttributeMap,
        attributeNames: [
            Phase2AttributeNames.AtlasName,
            Phase2AttributeNames.TISSUE_OR_ORGAN_OF_ORIGIN_UBERON_CODE,
            Phase2AttributeNames.PRIMARY_DIAGNOSIS_NCI_THESAURUS_ID,
            Phase2AttributeNames.SEX,
            Phase2AttributeNames.RACE,
            Phase2AttributeNames.ETHNIC_GROUP,
            Phase2AttributeNames.TREATMENT_TYPE,
            Phase2AttributeNames.assayName,
            Phase2AttributeNames.level,
            Phase2AttributeNames.FileFormat,
        ],
        entities: [] as TableRow[],
        setFilter,
        selectedFiltersByGroupName,
        selectedFilters,
        groupsByProperty: groupsByProperty as any,
        optionMapper: (val: CountByType) => ({
            value: val.val,
            label: val.val,
            count: parseInt(val.count as string),
        }),
    };

    const options = getOptionsFromProps(filterControlsProps);
    const dropdownProps = getDropdownOptionsFromProps(
        filterControlsProps,
        options
    );
    const cls = 'filterCheckboxListContainer';

    return (
        <FilterControls {...filterControlsProps}>
            <FilterDropdown
                {...dropdownProps}
                placeholder="Atlas"
                attributes={[Phase2AttributeNames.AtlasName]}
                className={cls}
            />
            <FilterDropdown
                {...dropdownProps}
                placeholder="Organ"
                attributes={[
                    Phase2AttributeNames.TISSUE_OR_ORGAN_OF_ORIGIN_UBERON_CODE,
                ]}
                className={cls}
                width={100}
            />
            <FilterDropdown
                {...dropdownProps}
                placeholder="Disease"
                attributes={[
                    Phase2AttributeNames.PRIMARY_DIAGNOSIS_NCI_THESAURUS_ID,
                ]}
                className={cls}
                width={120}
            />
            <FilterDropdown
                {...dropdownProps}
                placeholder="Demographics"
                attributes={[
                    Phase2AttributeNames.SEX,
                    Phase2AttributeNames.RACE,
                    Phase2AttributeNames.ETHNIC_GROUP,
                ]}
                className={cls}
                width={164}
            />
            <FilterDropdown
                {...dropdownProps}
                placeholder="Treatment"
                attributes={[Phase2AttributeNames.TREATMENT_TYPE]}
                className={cls}
                width={120}
            />
            <FilterDropdown
                {...dropdownProps}
                placeholder="Assay"
                attributes={[Phase2AttributeNames.assayName]}
                className={cls}
            />
            <FilterDropdown
                {...dropdownProps}
                placeholder="File"
                attributes={[
                    Phase2AttributeNames.level,
                    Phase2AttributeNames.FileFormat,
                ]}
                className={cls}
                width={80}
            />
        </FilterControls>
    );
}

// ─── Main Explore2 component ──────────────────────────────────────────────────
export const Explore2: React.FunctionComponent<IExplore2Props> = (props) => {
    const tabFromProps = (props.getTab?.() || ExploreTab.CASES) as ExploreTab;
    const [activeTab, setActiveTab] = useState<ExploreTab>(tabFromProps);
    const [filterOptions, setFilterOptions] = useState<CountByType[]>([]);
    const [files, setFiles] = useState<TableRow[]>([]);
    const [cases, setCases] = useState<TableRow[]>([]);
    const [specimens, setSpecimens] = useState<TableRow[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string>();
    const [selectedFilters, setSelectedFilters] = useState<SelectedFilter[]>(
        (props.getSelectedFilters?.() as SelectedFilter[] | undefined) || []
    );

    // Sync tab from URL
    useEffect(() => {
        setActiveTab(tabFromProps);
    }, [tabFromProps]);

    const handleSetFilter = (actionMeta: FilterActionMeta<SelectedFilter>) => {
        const newFilters = getNewFilters(selectedFilters, actionMeta);
        setSelectedFilters(newFilters);
        props.onFilterChange?.(newFilters);
    };

    const selectedFiltersKey = JSON.stringify(selectedFilters);

    useEffect(() => {
        let active = true;

        async function load() {
            setIsLoading(true);
            setError(undefined);

            try {
                const phase2Client = getPhase2Client();

                // Resolve fieldTypes from unfiltered options for WHERE clause
                const unfilteredCounts = await doQuery<CountByType>(
                    countsByTypeQuery2(defaultCountsByTypeQueryFilterString),
                    phase2Client
                );
                if (!active) return;

                const filterString = getFilterString2(
                    selectedFilters,
                    unfilteredCounts
                );

                // Fetch per-filter dropdown counts
                const filterCountsQuery =
                    filterString === ''
                        ? Promise.resolve(unfilteredCounts)
                        : doQuery<CountByType>(
                              countsByTypeQuery2({
                                  genderFilterString: filterString,
                                  raceFilterString: filterString,
                                  primaryDiagnosisFilterString: filterString,
                                  ethnicityFilterString: filterString,
                                  tissueOrOrganOfOriginFilterString: filterString,
                                  levelFilterString: filterString,
                                  assayNameFilterString: filterString,
                                  treatmentTypeFilterString: filterString,
                                  fileFormatFilterString: filterString,
                                  atlasNameFilterString: filterString,
                              }),
                              phase2Client
                          );

                const [
                    filteredCounts,
                    fileRows,
                    caseRows,
                    specimenRows,
                ] = await Promise.all([
                    filterCountsQuery,
                    doQuery<TableRow>(fileQuery2 + filterString, phase2Client),
                    doQuery<TableRow>(
                        caseQuery2({ filterString }),
                        phase2Client
                    ),
                    doQuery<TableRow>(
                        specimenQuery2({ filterString }),
                        phase2Client
                    ),
                ]);

                if (!active) return;

                setFilterOptions(filteredCounts);
                setFiles(fileRows);
                setCases(caseRows);
                setSpecimens(specimenRows);
            } catch (err) {
                if (!active) return;
                setError(
                    err instanceof Error
                        ? err.message
                        : 'Failed to load Phase 2 data.'
                );
            } finally {
                if (active) setIsLoading(false);
            }
        }

        load();
        return () => {
            active = false;
        };
    }, [selectedFiltersKey]);

    // groupsByProperty keyed by Phase2AttributeNames type strings
    const groupsByProperty = useMemo(() => {
        return filterOptions.reduce<Record<string, CountByType[]>>(
            (acc, opt) => {
                if (!acc[opt.type]) acc[opt.type] = [];
                acc[opt.type].push(opt);
                return acc;
            },
            {}
        );
    }, [filterOptions]);

    const selectedFiltersByAttrName = useMemo(
        () => getSelectedFiltersByAttrName(selectedFilters),
        [selectedFilters]
    );

    const atlasSummaryRows = useMemo<AtlasSummaryRow[]>(() => {
        const atlasCounts = new Map<
            string,
            Omit<AtlasSummaryRow, 'atlas_name'>
        >();

        const increment = (
            atlasName: string,
            field: keyof Omit<AtlasSummaryRow, 'atlas_name'>
        ) => {
            const key = atlasName || 'Unknown';
            const current = atlasCounts.get(key) || {
                caseCount: 0,
                biospecimenCount: 0,
                fileCount: 0,
            };
            current[field] += 1;
            atlasCounts.set(key, current);
        };

        cases.forEach((row) =>
            increment(String(row.atlas_name || ''), 'caseCount')
        );
        specimens.forEach((row) =>
            increment(String(row.atlas_name || ''), 'biospecimenCount')
        );
        files.forEach((row) =>
            increment(String(row.atlas_name || ''), 'fileCount')
        );

        return Array.from(atlasCounts.entries())
            .map(([atlas_name, counts]) => ({ atlas_name, ...counts }))
            .sort((a, b) => a.atlas_name.localeCompare(b.atlas_name));
    }, [cases, specimens, files]);

    const getFilterDisplayName = (group: string): string => {
        const attr = group as Phase2AttributeNames;
        return Phase2AttributeMap[attr]?.displayName ?? group;
    };

    // Summary data — same shape as Explore 1
    const summaryData = useMemo(() => {
        const atlasCount =
            groupsByProperty[Phase2AttributeNames.AtlasName]?.length ?? 0;
        const diagnosisCount =
            groupsByProperty[
                Phase2AttributeNames.PRIMARY_DIAGNOSIS_NCI_THESAURUS_ID
            ]?.length ?? 0;
        const assayCount =
            groupsByProperty[Phase2AttributeNames.assayName]?.length ?? 0;
        return [
            { displayName: 'Atlas', values: Array(atlasCount).fill(null) },
            {
                displayName: 'Cancer Type',
                values: Array(diagnosisCount).fill(null),
            },
            { displayName: 'Case', values: cases },
            { displayName: 'Biospecimen', values: specimens },
            { displayName: 'Assay', values: Array(assayCount).fill(null) },
            { displayName: 'File', values: files },
        ];
    }, [groupsByProperty, cases, specimens, files]);

    return (
        <div style={{ padding: 20 }}>
            {/* Filter Controls — same dropdown layout as Explore 1 */}
            <Phase2FilterControls
                selectedFilters={selectedFilters}
                selectedFiltersByGroupName={selectedFiltersByAttrName}
                groupsByProperty={groupsByProperty}
                setFilter={handleSetFilter}
            />

            {/* Active filter tags */}
            <Filter
                setFilter={handleSetFilter}
                selectedFiltersByGroupName={selectedFiltersByAttrName}
                getFilterDisplayName={getFilterDisplayName}
            />

            {/* Summary bar */}
            <ExploreSummary summaryData={summaryData} />

            {/* Loading / error */}
            {isLoading && (
                <div style={{ textAlign: 'center', padding: 40 }}>
                    <ScaleLoader />
                </div>
            )}
            {error && <div className="alert alert-danger">{error}</div>}

            {/* Tabs — same HTML structure as Explore 1 ExploreTabs */}
            {!isLoading && !error && (
                <>
                    <div className="subnav">
                        <ul className="nav nav-tabs">
                            <li className="nav-item">
                                <a
                                    onClick={() =>
                                        setActiveTab(ExploreTab.ATLAS)
                                    }
                                    className={`nav-link ${
                                        activeTab === ExploreTab.ATLAS
                                            ? 'active'
                                            : ''
                                    }`}
                                    style={{ cursor: 'pointer' }}
                                >
                                    Atlases
                                </a>
                            </li>
                            <li className="nav-item">
                                <a
                                    onClick={() =>
                                        setActiveTab(ExploreTab.CASES)
                                    }
                                    className={`nav-link ${
                                        activeTab === ExploreTab.CASES
                                            ? 'active'
                                            : ''
                                    }`}
                                    style={{ cursor: 'pointer' }}
                                >
                                    Cases
                                </a>
                            </li>
                            <li className="nav-item">
                                <a
                                    onClick={() =>
                                        setActiveTab(ExploreTab.BIOSPECIMEN)
                                    }
                                    className={`nav-link ${
                                        activeTab === ExploreTab.BIOSPECIMEN
                                            ? 'active'
                                            : ''
                                    }`}
                                    style={{ cursor: 'pointer' }}
                                >
                                    Biospecimens
                                </a>
                            </li>
                            <li className="nav-item">
                                <a
                                    onClick={() =>
                                        setActiveTab(ExploreTab.FILE)
                                    }
                                    className={`nav-link ${
                                        activeTab === ExploreTab.FILE
                                            ? 'active'
                                            : ''
                                    }`}
                                    style={{ cursor: 'pointer' }}
                                >
                                    Files
                                </a>
                            </li>
                        </ul>
                    </div>

                    {activeTab === ExploreTab.ATLAS && (
                        <div className="tab-content atlasTab">
                            <AtlasSummaryTable data={atlasSummaryRows} />
                        </div>
                    )}

                    {activeTab === ExploreTab.CASES && (
                        <div className="tab-content cases">
                            <Phase2Table
                                columns={CASE_COLUMNS}
                                data={cases}
                                defaultSortField="HTAN_PARTICIPANT_ID"
                            />
                        </div>
                    )}
                    {activeTab === ExploreTab.BIOSPECIMEN && (
                        <div className="tab-content biospecimen">
                            <Phase2Table
                                columns={SPECIMEN_COLUMNS}
                                data={specimens}
                                defaultSortField="HTAN_BIOSPECIMEN_ID"
                            />
                        </div>
                    )}
                    {activeTab === ExploreTab.FILE && (
                        <div className="tab-content fileTab">
                            <Phase2Table
                                columns={FILE_COLUMNS}
                                data={files}
                                defaultSortField="HTAN_DATA_FILE_ID"
                            />
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default Explore2;
