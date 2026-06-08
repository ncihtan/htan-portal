'use client';
import React, { useEffect, useMemo, useState } from 'react';

import {
    caseQuery2,
    CountByType,
    countsByTypeQuery2,
    defaultCountsByTypeQueryFilterString,
    doQuery,
    fileQuery2,
    getFilterString2,
    specimenQuery2,
} from '@htan/data-portal-commons';
import { SelectedFilter } from '@htan/data-portal-filter';
import {
    EnhancedDataTable,
    getDefaultDataTableStyle,
    IEnhancedDataTableColumn,
} from '@htan/data-portal-table';

export interface IExplore2Props {
    getAtlasMetaData: () => any;
    onFilterChange?: (selectedFilters: any[]) => void;
    getSelectedFilters?: () => any[];
    isReleaseQCEnabled?: () => boolean;
    setTab?: (tab: string) => void;
    getTab?: () => string;
}

type TableRow = Record<string, any>;

type FilterDefinition = {
    label: string;
    group: string;
};

const FILTERS: FilterDefinition[] = [
    { label: 'Atlas', group: 'AtlasName' },
    { label: 'SEX', group: 'SEX' },
    { label: 'RACE', group: 'RACE' },
    { label: 'ETHNIC_GROUP', group: 'ETHNIC_GROUP' },
    {
        label: 'PRIMARY_DIAGNOSIS_NCI_THESAURUS_ID',
        group: 'PRIMARY_DIAGNOSIS_NCI_THESAURUS_ID',
    },
    {
        label: 'TISSUE_OR_ORGAN_OF_ORIGIN_UBERON_CODE',
        group: 'TISSUE_OR_ORGAN_OF_ORIGIN_UBERON_CODE',
    },
    { label: 'TREATMENT_TYPE', group: 'TREATMENT_TYPE' },
    { label: 'assayName', group: 'assayName' },
    { label: 'level', group: 'level' },
    { label: 'FileFormat', group: 'FileFormat' },
];

const FILE_COLUMNS: IEnhancedDataTableColumn<TableRow>[] = [
    { name: 'synapseId', selector: 'synapseId', sortable: true },
    { name: 'atlasid', selector: 'atlasid', sortable: true },
    { name: 'atlas_name', selector: 'atlas_name', sortable: true },
    { name: 'level', selector: 'level', sortable: true },
    { name: 'assayName', selector: 'assayName', sortable: true },
    { name: 'Filename', selector: 'Filename', sortable: true },
    { name: 'FileFormat', selector: 'FileFormat', sortable: true },
    {
        name: 'HTAN_DATA_FILE_ID',
        selector: 'HTAN_DATA_FILE_ID',
        sortable: true,
    },
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
    { name: 'Component', selector: 'Component', sortable: true, omit: true },
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
    { name: 'Component', selector: 'Component', sortable: true, omit: true },
];

function formatValue(value: unknown) {
    if (Array.isArray(value)) {
        return value.join(', ');
    }

    return value == null ? '' : String(value);
}

function updateFiltersForGroup(
    selectedFilters: SelectedFilter[],
    group: string,
    values: string[]
) {
    return [
        ...selectedFilters.filter((filter) => filter.group !== group),
        ...values.map((value) => ({ group, value })),
    ];
}

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

export const Explore2: React.FunctionComponent<IExplore2Props> = (props) => {
    const selectedFilters =
        (props.getSelectedFilters?.() as SelectedFilter[] | undefined) || [];
    const selectedFiltersKey = JSON.stringify(selectedFilters);
    const tabFromProps = props.getTab?.() || 'file';
    const [activeTab, setActiveTab] = useState(tabFromProps);
    const [filterOptions, setFilterOptions] = useState<CountByType[]>([]);
    const [files, setFiles] = useState<TableRow[]>([]);
    const [cases, setCases] = useState<TableRow[]>([]);
    const [specimens, setSpecimens] = useState<TableRow[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string>();

    useEffect(() => {
        setActiveTab(tabFromProps);
    }, [tabFromProps]);

    useEffect(() => {
        let active = true;

        async function load() {
            setIsLoading(true);
            setError(undefined);

            try {
                const counts = await doQuery<CountByType>(
                    countsByTypeQuery2(defaultCountsByTypeQueryFilterString)
                );
                if (!active) {
                    return;
                }
                setFilterOptions(counts);

                const filterString = getFilterString2(selectedFilters, counts);
                const [fileRows, caseRows, specimenRows] = await Promise.all([
                    doQuery<TableRow>(fileQuery2 + filterString),
                    doQuery<TableRow>(caseQuery2({ filterString })),
                    doQuery<TableRow>(specimenQuery2({ filterString })),
                ]);

                if (!active) {
                    return;
                }

                setFiles(fileRows);
                setCases(caseRows);
                setSpecimens(specimenRows);
            } catch (err) {
                if (!active) {
                    return;
                }
                setError(
                    err instanceof Error
                        ? err.message
                        : 'Failed to load Phase 2 data.'
                );
            } finally {
                if (active) {
                    setIsLoading(false);
                }
            }
        }

        load();

        return () => {
            active = false;
        };
    }, [selectedFiltersKey]);

    const optionsByGroup = useMemo(() => {
        return filterOptions.reduce<Record<string, CountByType[]>>(
            (acc, option) => {
                if (!acc[option.type]) {
                    acc[option.type] = [];
                }
                acc[option.type].push(option);
                return acc;
            },
            {}
        );
    }, [filterOptions]);

    const selectedValuesByGroup = useMemo(() => {
        return selectedFilters.reduce<Record<string, string[]>>(
            (acc, filter) => {
                if (!acc[filter.group]) {
                    acc[filter.group] = [];
                }
                acc[filter.group].push(filter.value);
                return acc;
            },
            {}
        );
    }, [selectedFilters]);

    const handleFilterChange = (group: string, values: string[]) => {
        props.onFilterChange?.(
            updateFiltersForGroup(selectedFilters, group, values)
        );
    };

    return (
        <div>
            <h2>HTAN Phase 2 Explorer</h2>
            <p>
                Explore Phase 2 files, cases, and biospecimens with preserved
                Phase 2 field names.
            </p>

            <div
                className="mb-3"
                style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem' }}
            >
                {FILTERS.map((filter) => {
                    const options = (
                        optionsByGroup[filter.group] || []
                    ).sort((a, b) => a.val.localeCompare(b.val));

                    return (
                        <label
                            key={filter.group}
                            style={{
                                display: 'flex',
                                flexDirection: 'column',
                                minWidth: 220,
                            }}
                        >
                            <strong>{filter.label}</strong>
                            <select
                                multiple
                                size={Math.min(Math.max(options.length, 2), 6)}
                                value={
                                    selectedValuesByGroup[filter.group] || []
                                }
                                onChange={(event) => {
                                    const values = Array.from(
                                        event.target.selectedOptions,
                                        (option) => option.value
                                    );
                                    handleFilterChange(filter.group, values);
                                }}
                            >
                                {options.map((option) => (
                                    <option
                                        key={`${filter.group}-${option.val}`}
                                        value={option.val}
                                    >
                                        {`${option.val} (${option.count})`}
                                    </option>
                                ))}
                            </select>
                        </label>
                    );
                })}
            </div>

            <div
                className="mb-3"
                style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}
            >
                {[
                    ['file', `Files (${files.length})`],
                    ['cases', `Cases (${cases.length})`],
                    ['biospecimen', `Biospecimen (${specimens.length})`],
                ].map(([tab, label]) => (
                    <button
                        key={tab}
                        className={`btn ${
                            activeTab === tab
                                ? 'btn-primary'
                                : 'btn-outline-primary'
                        }`}
                        onClick={() => setActiveTab(tab)}
                        type="button"
                    >
                        {label}
                    </button>
                ))}
            </div>

            {error && <div className="alert alert-danger">{error}</div>}
            {isLoading && <p>Loading Phase 2 data…</p>}

            {!isLoading && !error && activeTab === 'file' && (
                <Phase2Table
                    columns={FILE_COLUMNS}
                    data={files}
                    defaultSortField="HTAN_DATA_FILE_ID"
                />
            )}
            {!isLoading && !error && activeTab === 'cases' && (
                <Phase2Table
                    columns={CASE_COLUMNS}
                    data={cases}
                    defaultSortField="HTAN_PARTICIPANT_ID"
                />
            )}
            {!isLoading && !error && activeTab === 'biospecimen' && (
                <Phase2Table
                    columns={SPECIMEN_COLUMNS}
                    data={specimens}
                    defaultSortField="HTAN_BIOSPECIMEN_ID"
                />
            )}
        </div>
    );
};

export default Explore2;
