'use client';
import React, { useEffect, useMemo, useState } from 'react';
import { ScaleLoader } from 'react-spinners';
import Tooltip from 'rc-tooltip';

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
import { IAttributeInfo, truncateFilename } from '@htan/data-portal-utils';
import {
    EnhancedDataTable,
    getDefaultDataTableStyle,
    IEnhancedDataTableColumn,
} from '@htan/data-portal-table';
import {
    ExploreSummary,
    ExploreTab,
    truncatedTableCell,
} from '@htan/data-portal-explore';

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
    TISSUE_OR_ORGAN_OF_ORIGIN_UBERON_NAME = 'TISSUE_OR_ORGAN_OF_ORIGIN_UBERON_NAME',
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
        displayName: 'Organ Code',
    },
    [Phase2AttributeNames.TISSUE_OR_ORGAN_OF_ORIGIN_UBERON_NAME]: {
        path: 'TISSUE_OR_ORGAN_OF_ORIGIN_UBERON_NAME',
        displayName: 'Organ Name',
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

// Format code and name pairs from arrays (e.g., code 'UBERON:0001255' with name 'stomach')
function formatCodeNamePairs(codes: unknown, names: unknown): string {
    const codeArr = Array.isArray(codes) ? codes : codes ? [codes] : [];
    const nameArr = Array.isArray(names) ? names : names ? [names] : [];

    return codeArr
        .map((code, idx) => {
            const name = nameArr[idx];
            return name ? `${name} (${code})` : String(code);
        })
        .join(', ');
}

function FileNameCell({ row }: { row: TableRow }) {
    const fullName = String(row.Filename || '');
    const displayName = truncateFilename(fullName);
    const synapseId = row.synapseId as string | undefined;

    if (!fullName) return <span />;

    return (
        <Tooltip overlay={<span>{fullName}</span>}>
            <a
                target="_blank"
                rel="noopener noreferrer"
                href={
                    synapseId
                        ? `https://www.synapse.org/#!Synapse:${synapseId}`
                        : '#'
                }
                onClick={(e) => {
                    if (!synapseId) e.preventDefault();
                }}
            >
                {displayName}
            </a>
        </Tooltip>
    );
}

const FILE_COLUMNS: IEnhancedDataTableColumn<TableRow>[] = [
    {
        name: 'File Name',
        selector: 'Filename',
        cell: (row) => <FileNameCell row={row} />,
        sortable: true,
    },
    { name: 'Atlas Name', selector: 'atlas_name', sortable: true },
    {
        name: 'Biospecimen',
        selector: (row) => formatValue(row.biospecimenIds),
        getSearchValue: (row) => formatValue(row.biospecimenIds),
        sortable: true,
    },
    { name: 'Assay', selector: 'assayName', sortable: true },
    { name: 'Level', selector: 'level', sortable: true },
    {
        name: 'Organ',
        selector: (row) =>
            formatCodeNamePairs(
                row.TISSUE_OR_ORGAN_OF_ORIGIN_UBERON_CODE,
                row.TISSUE_OR_ORGAN_OF_ORIGIN_UBERON_NAME
            ),
        getSearchValue: (row) =>
            formatCodeNamePairs(
                row.TISSUE_OR_ORGAN_OF_ORIGIN_UBERON_CODE,
                row.TISSUE_OR_ORGAN_OF_ORIGIN_UBERON_NAME
            ),
        cell: truncatedTableCell,
        wrap: true,
        sortable: true,
    },
    { name: 'File Format', selector: 'FileFormat', sortable: true },
    {
        name: 'Data File ID',
        selector: 'HTAN_DATA_FILE_ID',
        sortable: true,
        omit: true,
    },
    { name: 'Synapse ID', selector: 'synapseId', sortable: true, omit: true },
    {
        name: 'Primary Diagnosis',
        selector: (row) => formatValue(row.PRIMARY_DIAGNOSIS_NCI_THESAURUS_ID),
        getSearchValue: (row) =>
            formatValue(row.PRIMARY_DIAGNOSIS_NCI_THESAURUS_ID),
        cell: truncatedTableCell,
        wrap: true,
        sortable: true,
    },
    {
        name: 'Parent ID',
        selector: (row) => row.HTAN_PARENT_ID ?? row.ParentDataFileID,
        getSearchValue: (row) => row.HTAN_PARENT_ID ?? row.ParentDataFileID,
        sortable: true,
        omit: true,
    },
    {
        name: 'Sex',
        selector: (row) => formatValue(row.SEX),
        getSearchValue: (row) => formatValue(row.SEX),
        sortable: true,
    },
    {
        name: 'Ethnic Group',
        selector: (row) => formatValue(row.ETHNIC_GROUP),
        getSearchValue: (row) => formatValue(row.ETHNIC_GROUP),
        sortable: true,
    },
    {
        name: 'Race',
        selector: (row) => formatValue(row.RACE),
        getSearchValue: (row) => formatValue(row.RACE),
        sortable: true,
    },
    {
        name: 'Vital Status',
        selector: (row) => formatValue(row.VITAL_STATUS),
        getSearchValue: (row) => formatValue(row.VITAL_STATUS),
        sortable: true,
    },
    {
        name: 'Treatment Type',
        selector: (row) => formatValue(row.TREATMENT_TYPE),
        getSearchValue: (row) => formatValue(row.TREATMENT_TYPE),
        sortable: true,
        omit: true,
    },
    {
        name: 'Tissue/Organ of Origin',
        selector: (row) =>
            formatCodeNamePairs(
                row.TISSUE_OR_ORGAN_OF_ORIGIN_UBERON_CODE,
                row.TISSUE_OR_ORGAN_OF_ORIGIN_UBERON_NAME
            ),
        getSearchValue: (row) =>
            formatCodeNamePairs(
                row.TISSUE_OR_ORGAN_OF_ORIGIN_UBERON_CODE,
                row.TISSUE_OR_ORGAN_OF_ORIGIN_UBERON_NAME
            ),
        cell: truncatedTableCell,
        wrap: true,
        sortable: true,
        omit: true,
    },
    {
        name: 'Workflow Type',
        selector: 'ScRNAseqWorkflowType',
        sortable: true,
        omit: true,
    },
    {
        name: 'Workflow Parameters Description',
        selector: 'ScRNAseqWorkflowParametersDescription',
        sortable: true,
        omit: true,
    },
    {
        name: 'Workflow Version',
        selector: 'WorkflowVersion',
        sortable: true,
        omit: true,
    },
    {
        name: 'Workflow Link',
        selector: 'WorkflowLink',
        sortable: true,
        omit: true,
    },
    {
        name: 'Diagnosis IDs',
        selector: 'diagnosisIds',
        sortable: true,
        omit: true,
    },
    {
        name: 'Demographics IDs',
        selector: 'demographicsIds',
        sortable: true,
        omit: true,
    },
    { name: 'Therapy IDs', selector: 'therapyIds', sortable: true, omit: true },
    {
        name: 'Raw Sequencing',
        selector: 'isRawSequencing',
        sortable: true,
        omit: true,
    },
    { name: 'Component', selector: 'Component', sortable: true, omit: true },
    { name: 'Atlas ID', selector: 'atlasid', sortable: true, omit: true },

    // ── Synapse / file-registry metadata (common to all file tables) ────────────
    { name: 'BQ Hash ID', selector: 'BQ_Hash_ID', sortable: true, omit: true },
    {
        name: 'File Name (Registry)',
        selector: 'File_Name',
        sortable: true,
        omit: true,
    },
    { name: 'Created By', selector: 'Created_By', sortable: true, omit: true },
    { name: 'Created On', selector: 'Created_On', sortable: true, omit: true },
    { name: 'Modified On', selector: 'modifiedOn', sortable: true, omit: true },
    { name: 'Modified By', selector: 'modifiedBy', sortable: true, omit: true },
    {
        name: 'Description',
        selector: 'Description',
        sortable: true,
        omit: true,
    },
    { name: 'Etag', selector: 'Etag', sortable: true, omit: true },
    { name: 'Path', selector: 'Path', sortable: true, omit: true },
    {
        name: 'Entity Type',
        selector: 'Entity_Type',
        sortable: true,
        omit: true,
    },
    {
        name: 'Current Version',
        selector: 'Current_Version',
        sortable: true,
        omit: true,
    },
    {
        name: 'Parent Entity ID',
        selector: 'Parent_EntityId',
        sortable: true,
        omit: true,
    },
    {
        name: 'Benefactor Entity ID',
        selector: 'Benefactor_EntityId',
        sortable: true,
        omit: true,
    },
    {
        name: 'Project Entity ID',
        selector: 'Project_EntityId',
        sortable: true,
        omit: true,
    },
    {
        name: 'Folder Entity ID',
        selector: 'Folder_EntityId',
        sortable: true,
        omit: true,
    },
    {
        name: 'Status Folder Name',
        selector: 'Status_Folder_Name',
        sortable: true,
        omit: true,
    },
    {
        name: 'File Handle ID',
        selector: 'File_Handle_Id',
        sortable: true,
        omit: true,
    },
    {
        name: 'File Handle Type',
        selector: 'File_Handle_Type',
        sortable: true,
        omit: true,
    },
    {
        name: 'Data File Name',
        selector: 'dataFileName',
        sortable: true,
        omit: true,
    },
    {
        name: 'File Size (Bytes)',
        selector: 'File_Size_Bytes',
        sortable: true,
        omit: true,
    },
    { name: 'File MD5', selector: 'File_MD5', sortable: true, omit: true },
    { name: 'S3 Bucket', selector: 'S3_Bucket', sortable: true, omit: true },
    { name: 'S3 Key', selector: 'S3_Key', sortable: true, omit: true },
    { name: 'Checksum', selector: 'CHECKSUM', sortable: true, omit: true },
    {
        name: 'Protocol Link',
        selector: 'PROTOCOL_LINK',
        sortable: true,
        omit: true,
    },

    // ── Sequencing / library prep (BulkWES / scRNA shared) ─────────────────────
    {
        name: 'Sequencing Platform',
        selector: 'SEQUENCING_PLATFORM',
        sortable: true,
        omit: true,
    },
    {
        name: 'Sequencing Batch ID',
        selector: 'SEQUENCING_BATCH_ID',
        sortable: true,
        omit: true,
    },
    {
        name: 'Library Layout',
        selector: 'LIBRARY_LAYOUT',
        sortable: true,
        omit: true,
    },
    {
        name: 'Library Preparation Days From Index',
        selector: 'LIBRARY_PREPARATION_DAYS_FROM_INDEX',
        sortable: true,
        omit: true,
    },
    {
        name: 'Technical Replicate Group',
        selector: 'TECHNICAL_REPLICATE_GROUP',
        sortable: true,
        omit: true,
    },
    {
        name: 'Genomic Reference',
        selector: 'GENOMIC_REFERENCE',
        sortable: true,
        omit: true,
    },
    {
        name: 'Genomic Reference URL',
        selector: 'GENOMIC_REFERENCE_URL',
        sortable: true,
        omit: true,
    },
    {
        name: 'Genome Annotation URL',
        selector: 'GENOME_ANNOTATION_URL',
        sortable: true,
        omit: true,
    },

    // ── BulkWES Level 1 specific ────────────────────────────────────────────────
    {
        name: 'Lane Number',
        selector: 'LANE_NUMBER',
        sortable: true,
        omit: true,
    },
    {
        name: 'Read Length',
        selector: 'READ_LENGTH',
        sortable: true,
        omit: true,
    },
    {
        name: 'Adapter Name',
        selector: 'ADAPTER_NAME',
        sortable: true,
        omit: true,
    },
    {
        name: 'Target Depth',
        selector: 'TARGET_DEPTH',
        sortable: true,
        omit: true,
    },
    {
        name: 'Read Indicator',
        selector: 'READ_INDICATOR',
        sortable: true,
        omit: true,
    },
    {
        name: 'Adapter Sequence',
        selector: 'ADAPTER_SEQUENCE',
        sortable: true,
        omit: true,
    },
    {
        name: 'Base Caller Name',
        selector: 'BASE_CALLER_NAME',
        sortable: true,
        omit: true,
    },
    {
        name: 'Base Caller Version',
        selector: 'BASE_CALLER_VERSION',
        sortable: true,
        omit: true,
    },
    {
        name: 'Flow Cell Barcode',
        selector: 'FLOW_CELL_BARCODE',
        sortable: true,
        omit: true,
    },
    {
        name: 'Multiplex Barcode',
        selector: 'MULTIPLEX_BARCODE',
        sortable: true,
        omit: true,
    },
    {
        name: 'Target Capture Kit',
        selector: 'TARGET_CAPTURE_KIT',
        sortable: true,
        omit: true,
    },
    {
        name: 'Fragment Mean Length',
        selector: 'FRAGMENT_MEAN_LENGTH',
        sortable: true,
        omit: true,
    },
    {
        name: 'Fragment Maximum Length',
        selector: 'FRAGMENT_MAXIMUM_LENGTH',
        sortable: true,
        omit: true,
    },
    {
        name: 'Fragment Minimum Length',
        selector: 'FRAGMENT_MINIMUM_LENGTH',
        sortable: true,
        omit: true,
    },
    {
        name: 'Fragment Std Dev Length',
        selector: 'FRAGMENT_STANDARD_DEVIATION_LENGTH',
        sortable: true,
        omit: true,
    },
    {
        name: 'Size Selection Range',
        selector: 'SIZE_SELECTION_RANGE',
        sortable: true,
        omit: true,
    },
    {
        name: 'Library Selection Method',
        selector: 'LIBRARY_SELECTION_METHOD',
        sortable: true,
        omit: true,
    },
    {
        name: 'Library Preparation Kit Name',
        selector: 'LIBRARY_PREPARATION_KIT_NAME',
        sortable: true,
        omit: true,
    },
    {
        name: 'Library Preparation Kit Vendor',
        selector: 'LIBRARY_PREPARATION_KIT_VENDOR',
        sortable: true,
        omit: true,
    },
    {
        name: 'Library Preparation Kit Version',
        selector: 'LIBRARY_PREPARATION_KIT_VERSION',
        sortable: true,
        omit: true,
    },
    {
        name: 'To Trim Adapter Sequence',
        selector: 'TO_TRIM_ADAPTER_SEQUENCE',
        sortable: true,
        omit: true,
    },

    // ── BulkWES Level 2 specific ────────────────────────────────────────────────
    {
        name: 'Alignment Workflow Type',
        selector: 'ALIGNMENT_WORKFLOW_TYPE',
        sortable: true,
        omit: true,
    },
    {
        name: 'QC Workflow Type',
        selector: 'QC_WORKFLOW_TYPE',
        sortable: true,
        omit: true,
    },
    {
        name: 'QC Workflow Version',
        selector: 'QC_WORKFLOW_VERSION',
        sortable: true,
        omit: true,
    },
    {
        name: 'QC Workflow Link',
        selector: 'QC_WORKFLOW_LINK',
        sortable: true,
        omit: true,
    },
    {
        name: 'Short Reads',
        selector: 'SHORT_READS',
        sortable: true,
        omit: true,
    },
    {
        name: 'Total Reads',
        selector: 'TOTAL_READS',
        sortable: true,
        omit: true,
    },
    {
        name: 'Total Uniquely Mapped',
        selector: 'TOTAL_UNIQUELY_MAPPED',
        sortable: true,
        omit: true,
    },
    {
        name: 'Total Unmapped Reads',
        selector: 'TOTAL_UNMAPPED_READS',
        sortable: true,
        omit: true,
    },
    {
        name: 'Mean Coverage',
        selector: 'MEAN_COVERAGE',
        sortable: true,
        omit: true,
    },
    {
        name: 'Average Read Length',
        selector: 'AVERAGE_READ_LENGTH',
        sortable: true,
        omit: true,
    },
    {
        name: 'Average Insert Size',
        selector: 'AVERAGE_INSERT_SIZE',
        sortable: true,
        omit: true,
    },
    {
        name: 'Average Base Quality',
        selector: 'AVERAGE_BASE_QUALITY',
        sortable: true,
        omit: true,
    },
    {
        name: 'Percent GC Content',
        selector: 'PERCENT_GC_CONTENT',
        sortable: true,
        omit: true,
    },
    {
        name: 'Contamination',
        selector: 'CONTAMINATION',
        sortable: true,
        omit: true,
    },
    {
        name: 'Contamination Error',
        selector: 'CONTAMINATION_ERROR',
        sortable: true,
        omit: true,
    },
    {
        name: 'Pairs on Different Chr',
        selector: 'PAIRS_ON_DIFF_CHR',
        sortable: true,
        omit: true,
    },
    {
        name: 'Proportion Reads Mapped',
        selector: 'PROPORTION_READS_MAPPED',
        sortable: true,
        omit: true,
    },
    {
        name: 'Proportion Reads Duplicated',
        selector: 'PROPORTION_READS_DUPLICATED',
        sortable: true,
        omit: true,
    },
    {
        name: 'Proportion Base Mismatch',
        selector: 'PROPORTION_BASE_MISMATCH',
        sortable: true,
        omit: true,
    },
    {
        name: 'Proportion Coverage 10X',
        selector: 'PROPORTION_COVERAGE_10X',
        sortable: true,
        omit: true,
    },
    {
        name: 'Proportion Coverage 30X',
        selector: 'PROPORTION_COVERAGE_30X',
        sortable: true,
        omit: true,
    },
    {
        name: 'Proportion Targets No Coverage',
        selector: 'PROPORTION_TARGETS_NO_COVERAGE',
        sortable: true,
        omit: true,
    },
    {
        name: 'Adapter Content',
        selector: 'ADAPTER_CONTENT',
        sortable: true,
        omit: true,
    },
    {
        name: 'Basic Statistics',
        selector: 'BASIC_STATISTICS',
        sortable: true,
        omit: true,
    },
    {
        name: 'Index File Name',
        selector: 'INDEX_FILE_NAME',
        sortable: true,
        omit: true,
    },
    {
        name: 'Is Lowest Level',
        selector: 'IS_LOWEST_LEVEL',
        sortable: true,
        omit: true,
    },
    { name: 'Encoding', selector: 'ENCODING', sortable: true, omit: true },
    {
        name: 'Overrepresented Sequences',
        selector: 'OVERREPRESENTED_SEQUENCES',
        sortable: true,
        omit: true,
    },
    {
        name: 'Per Base N Content',
        selector: 'PER_BASE_N_CONTENT',
        sortable: true,
        omit: true,
    },
    {
        name: 'Per Base Sequence Content',
        selector: 'PER_BASE_SEQUENCE_CONTENT',
        sortable: true,
        omit: true,
    },
    {
        name: 'Per Base Sequence Quality',
        selector: 'PER_BASE_SEQUENCE_QUALITY',
        sortable: true,
        omit: true,
    },
    {
        name: 'Per Tile Sequence Quality',
        selector: 'PER_TILE_SEQUENCE_QUALITY',
        sortable: true,
        omit: true,
    },
    {
        name: 'Per Sequence GC Content',
        selector: 'PER_SEQUENCE_GC_CONTENT',
        sortable: true,
        omit: true,
    },
    {
        name: 'Per Sequence Quality Score',
        selector: 'PER_SEQUENCE_QUALITY_SCORE',
        sortable: true,
        omit: true,
    },
    {
        name: 'Sequence Duplication Levels',
        selector: 'SEQUENCE_DUPLICATION_LEVELS',
        sortable: true,
        omit: true,
    },
    {
        name: 'Sequence Length Distribution',
        selector: 'SEQUENCE_LENGTH_DISTRIBUTION',
        sortable: true,
        omit: true,
    },

    // ── BulkWES Level 3 specific ────────────────────────────────────────────────
    { name: 'MSI Score', selector: 'MSI_SCORE', sortable: true, omit: true },
    { name: 'MSI Status', selector: 'MSI_STATUS', sortable: true, omit: true },
    {
        name: 'MSI Workflow Link',
        selector: 'MSI_WORKFLOW_LINK',
        sortable: true,
        omit: true,
    },
    {
        name: 'Somatic Variants Sample Type',
        selector: 'SOMATIC_VARIANTS_SAMPLE_TYPE',
        sortable: true,
        omit: true,
    },
    {
        name: 'Somatic Variants Workflow Type',
        selector: 'SOMATIC_VARIANTS_WORKFLOW_TYPE',
        sortable: true,
        omit: true,
    },
    {
        name: 'Somatic Variants Workflow URL',
        selector: 'SOMATIC_VARIANTS_WORKFLOW_URL',
        sortable: true,
        omit: true,
    },
    {
        name: 'Germline Variants Workflow Type',
        selector: 'GERMLINE_VARIANTS_WORKFLOW_TYPE',
        sortable: true,
        omit: true,
    },
    {
        name: 'Germline Variants Workflow URL',
        selector: 'GERMLINE_VARIANTS_WORKFLOW_URL',
        sortable: true,
        omit: true,
    },
    {
        name: 'Structural Variant Workflow Type',
        selector: 'STRUCTURAL_VARIANT_WORKFLOW_TYPE',
        sortable: true,
        omit: true,
    },
    {
        name: 'Structural Variant Workflow URL',
        selector: 'STRUCTURAL_VARIANT_WORKFLOW_URL',
        sortable: true,
        omit: true,
    },

    // ── scRNA Level 1 specific ──────────────────────────────────────────────────
    { name: 'Spike In', selector: 'SPIKE_IN', sortable: true, omit: true },
    {
        name: 'Dissociation Method',
        selector: 'DISSOCIATION_METHOD',
        sortable: true,
        omit: true,
    },
    {
        name: 'Nucleic Acid Source',
        selector: 'NUCLEIC_ACID_SOURCE',
        sortable: true,
        omit: true,
    },
    {
        name: 'Library Construction Method',
        selector: 'LIBRARY_CONSTRUCTION_METHOD',
        sortable: true,
        omit: true,
    },
    {
        name: 'Reverse Transcription Primer',
        selector: 'REVERSE_TRANSCRIPTION_PRIMER',
        sortable: true,
        omit: true,
    },
    {
        name: 'Single Cell Isolation Method',
        selector: 'SINGLE_CELL_ISOLATION_METHOD',
        sortable: true,
        omit: true,
    },
    {
        name: 'Cryopreserved Cells in Sample',
        selector: 'CRYOPRESERVED_CELLS_IN_SAMPLE',
        sortable: true,
        omit: true,
    },

    // ── scRNA Level 2 specific ──────────────────────────────────────────────────
    { name: 'UMI Tag', selector: 'UMI_TAG', sortable: true, omit: true },
    {
        name: 'Cell Barcode Tag',
        selector: 'CELL_BARCODE_TAG',
        sortable: true,
        omit: true,
    },
    {
        name: 'Whitelist Cell Barcode File Link',
        selector: 'WHITELIST_CELL_BARCODE_FILE_LINK',
        sortable: true,
        omit: true,
    },

    // ── scRNA Level 3/4 specific ────────────────────────────────────────────────
    { name: 'Cell Total', selector: 'CELL_TOTAL', sortable: true, omit: true },
    {
        name: 'Cell Median Number of Genes',
        selector: 'CELL_MEDIAN_NUMBER_GENES',
        sortable: true,
        omit: true,
    },
    {
        name: 'Cell Median Number of Reads',
        selector: 'CELL_MEDIAN_NUMBER_READS',
        sortable: true,
        omit: true,
    },
    {
        name: 'Matrix Type',
        selector: 'MATRIX_TYPE',
        sortable: true,
        omit: true,
    },
    {
        name: 'Data Category',
        selector: 'DATA_CATEGORY',
        sortable: true,
        omit: true,
    },
    {
        name: 'Linked Matrices',
        selector: 'LINKED_MATRICES',
        sortable: true,
        omit: true,
    },
    {
        name: 'AnnData Schema Version',
        selector: 'ANNDATA_SCHEMA_VERSION',
        sortable: true,
        omit: true,
    },
    {
        name: 'AnnData Structure Validated',
        selector: 'ANNDATA_STRUCTURE_VALIDATED',
        sortable: true,
        omit: true,
    },

    // ── Imaging shared (DigitalPathology + Multiplex Microscopy) ───────────────
    { name: 'License', selector: 'LICENSE', sortable: true, omit: true },
    { name: 'Species', selector: 'SPECIES', sortable: true, omit: true },
    {
        name: 'Image Modality',
        selector: 'IMAGE_MODALITY',
        sortable: true,
        omit: true,
    },
    {
        name: 'Staining Method',
        selector: 'STAINING_METHOD',
        sortable: true,
        omit: true,
    },
    {
        name: 'Imaging Protocol',
        selector: 'IMAGING_PROTOCOL',
        sortable: true,
        omit: true,
    },
    {
        name: 'Imaging Software',
        selector: 'IMAGING_SOFTWARE',
        sortable: true,
        omit: true,
    },
    {
        name: 'Imaging Equipment Model',
        selector: 'IMAGING_EQUIPMENT_MODEL',
        sortable: true,
        omit: true,
    },
    {
        name: 'Imaging Equipment Manufacturer',
        selector: 'IMAGING_EQUIPMENT_MANUFACTURER',
        sortable: true,
        omit: true,
    },
    {
        name: 'Nominal Magnification',
        selector: 'NOMINAL_MAGNIFICATION',
        sortable: true,
        omit: true,
    },
    {
        name: 'Lens Numerical Aperture',
        selector: 'LENS_NUMERICAL_APERTURE',
        sortable: true,
        omit: true,
    },
    { name: 'Objective', selector: 'OBJECTIVE', sortable: true, omit: true },
    { name: 'Immersion', selector: 'IMMERSION', sortable: true, omit: true },
    { name: 'Passed QC', selector: 'PASSED_QC', sortable: true, omit: true },
    { name: 'QC Comment', selector: 'QC_COMMENT', sortable: true, omit: true },
    {
        name: 'De-Identified',
        selector: 'DE_IDENTIFIED',
        sortable: true,
        omit: true,
    },
    {
        name: 'Has Slide Label',
        selector: 'HAS_SLIDE_LABEL',
        sortable: true,
        omit: true,
    },
    {
        name: 'Slide Label Redacted',
        selector: 'SLIDE_LABEL_REDACTED',
        sortable: true,
        omit: true,
    },
    {
        name: 'Citation or DOI',
        selector: 'CITATION_OR_DOI',
        sortable: true,
        omit: true,
    },
    {
        name: 'Has Annotations',
        selector: 'HAS_ANNOTATIONS',
        sortable: true,
        omit: true,
    },
    {
        name: 'Annotation Type',
        selector: 'ANNOTATION_TYPE',
        sortable: true,
        omit: true,
    },
    {
        name: 'Experimental Strategy and Data Subtypes',
        selector: 'EXPERIMENTAL_STRATEGY_AND_DATA_SUBTYPES',
        sortable: true,
        omit: true,
    },
    {
        name: 'De-Identification Software',
        selector: 'DE_IDENTIFICATION_SOFTWARE',
        sortable: true,
        omit: true,
    },
    {
        name: 'De-Identification Method Type',
        selector: 'DE_IDENTIFICATION_METHOD_TYPE',
        sortable: true,
        omit: true,
    },
    {
        name: 'De-Identification Method Description',
        selector: 'DE_IDENTIFICATION_METHOD_DESCRIPTION',
        sortable: true,
        omit: true,
    },

    // ── Multiplex Microscopy Level 2 specific ───────────────────────────────────
    {
        name: 'HTAN Panel ID',
        selector: 'HTAN_PANEL_ID',
        sortable: true,
        omit: true,
    },
    {
        name: 'Imaging Assay Type',
        selector: 'IMAGING_ASSAY_TYPE',
        sortable: true,
        omit: true,
    },
    { name: 'Size C', selector: 'SIZE_C', sortable: true, omit: true },
    { name: 'Size T', selector: 'SIZE_T', sortable: true, omit: true },
    { name: 'Size X', selector: 'SIZE_X', sortable: true, omit: true },
    { name: 'Size Y', selector: 'SIZE_Y', sortable: true, omit: true },
    { name: 'Size Z', selector: 'SIZE_Z', sortable: true, omit: true },
    {
        name: 'Physical Size X',
        selector: 'PHYSICAL_SIZE_X',
        sortable: true,
        omit: true,
    },
    {
        name: 'Physical Size Y',
        selector: 'PHYSICAL_SIZE_Y',
        sortable: true,
        omit: true,
    },
    {
        name: 'Physical Size Z',
        selector: 'PHYSICAL_SIZE_Z',
        sortable: true,
        omit: true,
    },
    { name: 'Pyramid', selector: 'PYRAMID', sortable: true, omit: true },
    {
        name: 'Working Distance',
        selector: 'WORKING_DISTANCE',
        sortable: true,
        omit: true,
    },

    // ── Multiplex Microscopy Level 3 specific ───────────────────────────────────
    {
        name: 'Segmentation Method',
        selector: 'SEGMENTATION_METHOD',
        sortable: true,
        omit: true,
    },
    {
        name: 'Segmentation Parameters',
        selector: 'SEGMENTATION_PARAMETERS',
        sortable: true,
        omit: true,
    },
    {
        name: 'Segmentation Workflow Type',
        selector: 'SEGMENTATION_WORKFLOW_TYPE',
        sortable: true,
        omit: true,
    },
    {
        name: 'Segmentation Workflow URL',
        selector: 'SEGMENTATION_WORKFLOW_URL',
        sortable: true,
        omit: true,
    },
    {
        name: 'Segmentation Workflow Version',
        selector: 'SEGMENTATION_WORKFLOW_VERSION',
        sortable: true,
        omit: true,
    },
    {
        name: 'Segmentation Annotation Type',
        selector: 'SEGMENTATION_ANNOTATION_TYPE',
        sortable: true,
        omit: true,
    },

    // ── Multiplex Microscopy Level 4 specific ───────────────────────────────────
    {
        name: 'Number of Objects',
        selector: 'NUMBER_OF_OBJECTS',
        sortable: true,
        omit: true,
    },
    {
        name: 'Number of Features',
        selector: 'NUMBER_OF_FEATURES',
        sortable: true,
        omit: true,
    },
    {
        name: 'Feature Extraction Method',
        selector: 'FEATURE_EXTRACTION_METHOD',
        sortable: true,
        omit: true,
    },
    {
        name: 'Feature Extraction Parameters',
        selector: 'FEATURE_EXTRACTION_PARAMETERS',
        sortable: true,
        omit: true,
    },
    {
        name: 'Feature Extraction Workflow Type',
        selector: 'FEATURE_EXTRACTION_WORKFLOW_TYPE',
        sortable: true,
        omit: true,
    },
    {
        name: 'Feature Extraction Workflow URL',
        selector: 'FEATURE_EXTRACTION_WORKFLOW_URL',
        sortable: true,
        omit: true,
    },
    {
        name: 'Feature Extraction Workflow Version',
        selector: 'FEATURE_EXTRACTION_WORKFLOW_VERSION',
        sortable: true,
        omit: true,
    },

    // ── Spatial Level 1 specific ────────────────────────────────────────────────
    { name: 'Platform', selector: 'PLATFORM', sortable: true, omit: true },
    { name: 'Assay Type', selector: 'ASSAY_TYPE', sortable: true, omit: true },
    { name: 'Has Images', selector: 'HAS_IMAGES', sortable: true, omit: true },
    {
        name: 'Image Types',
        selector: 'IMAGE_TYPES',
        sortable: true,
        omit: true,
    },
    {
        name: 'Has Probe Set',
        selector: 'HAS_PROBE_SET',
        sortable: true,
        omit: true,
    },
    {
        name: 'Has Sequencing',
        selector: 'HAS_SEQUENCING',
        sortable: true,
        omit: true,
    },
    {
        name: 'Bundle Contents',
        selector: 'BUNDLE_CONTENTS',
        sortable: true,
        omit: true,
    },
    {
        name: 'Sequencing File Type',
        selector: 'SEQUENCING_FILE_TYPE',
        sortable: true,
        omit: true,
    },
    {
        name: 'Has Registration Files',
        selector: 'HAS_REGISTRATION_FILES',
        sortable: true,
        omit: true,
    },

    // ── Spatial Level 3 specific ────────────────────────────────────────────────
    { name: 'Run ID', selector: 'RUN_ID', sortable: true, omit: true },
    { name: 'Panel Name', selector: 'PANEL_NAME', sortable: true, omit: true },
    {
        name: 'Panel Size Total Targets',
        selector: 'PANEL_SIZE_TOTAL_TARGETS',
        sortable: true,
        omit: true,
    },
    {
        name: 'Spatial Assay Type',
        selector: 'SPATIAL_ASSAY_TYPE',
        sortable: true,
        omit: true,
    },
    {
        name: 'Region Area',
        selector: 'REGION_AREA',
        sortable: true,
        omit: true,
    },
    {
        name: 'Capture Area',
        selector: 'CAPTURE_AREA',
        sortable: true,
        omit: true,
    },
    {
        name: 'RNA Measured',
        selector: 'RNA_MEASURED',
        sortable: true,
        omit: true,
    },
    {
        name: 'Protein Measured',
        selector: 'PROTEIN_MEASURED',
        sortable: true,
        omit: true,
    },
    {
        name: 'CytAssist Used',
        selector: 'CYTASSIST_USED',
        sortable: true,
        omit: true,
    },
    {
        name: 'Has Clustering',
        selector: 'HAS_CLUSTERING',
        sortable: true,
        omit: true,
    },
    {
        name: 'Clustering Method',
        selector: 'CLUSTERING_METHOD',
        sortable: true,
        omit: true,
    },
    {
        name: 'Number of Clusters',
        selector: 'NUMBER_OF_CLUSTERS',
        sortable: true,
        omit: true,
    },
    {
        name: 'Transcriptome Type',
        selector: 'TRANSCRIPTOME_TYPE',
        sortable: true,
        omit: true,
    },
    {
        name: 'Sequencing Depth',
        selector: 'SEQUENCING_DEPTH',
        sortable: true,
        omit: true,
    },
    {
        name: 'Sequencing Instrument',
        selector: 'SEQUENCING_INSTRUMENT',
        sortable: true,
        omit: true,
    },
    {
        name: 'Sequencing Configuration',
        selector: 'SEQUENCING_CONFIGURATION',
        sortable: true,
        omit: true,
    },
    {
        name: 'Assay Chemistry Version',
        selector: 'ASSAY_CHEMISTRY_VERSION',
        sortable: true,
        omit: true,
    },
    {
        name: 'Software and Version',
        selector: 'SOFTWARE_AND_VERSION',
        sortable: true,
        omit: true,
    },
    {
        name: 'Slide Serial Number',
        selector: 'SLIDE_SERIAL_NUMBER',
        sortable: true,
        omit: true,
    },
    {
        name: 'Has Cell Segmentation',
        selector: 'HAS_CELL_SEGMENTATION',
        sortable: true,
        omit: true,
    },
    {
        name: 'Cell Segmentation Method',
        selector: 'CELL_SEGMENTATION_METHOD',
        sortable: true,
        omit: true,
    },
    {
        name: 'Number of Segmented Cells',
        selector: 'NUMBER_OF_SEGMENTED_CELLS',
        sortable: true,
        omit: true,
    },
    {
        name: 'Cell Segmented Object Type',
        selector: 'CELL_SEGMENTED_OBJECT_TYPE',
        sortable: true,
        omit: true,
    },
    {
        name: 'Has Dimensionality Reduction',
        selector: 'HAS_DIMENSIONALITY_REDUCTION',
        sortable: true,
        omit: true,
    },
    {
        name: 'Dimensionality Reduction Method',
        selector: 'DIMENSIONALITY_REDUCTION_METHOD',
        sortable: true,
        omit: true,
    },
    {
        name: 'Portal Preview File',
        selector: 'PORTAL_PREVIEW_FILE',
        sortable: true,
        omit: true,
    },
    {
        name: 'QC Feature Number',
        selector: 'QC_FEATURE_NUMBER',
        sortable: true,
        omit: true,
    },
    {
        name: 'QC Total Genes Detected',
        selector: 'QC_TOTAL_GENES_DETECTED',
        sortable: true,
        omit: true,
    },
    {
        name: 'QC Total Number of Reads',
        selector: 'QC_TOTAL_NUMBER_OF_READS',
        sortable: true,
        omit: true,
    },
    {
        name: 'QC Mean Reads per Feature',
        selector: 'QC_MEAN_READS_PER_FEATURE',
        sortable: true,
        omit: true,
    },
    {
        name: 'QC Spatial Unit',
        selector: 'QC_SPATIAL_UNIT',
        sortable: true,
        omit: true,
    },
    {
        name: 'Same Section Imaging ID',
        selector: 'SAME_SECTION_IMAGING_ID',
        sortable: true,
        omit: true,
    },
    {
        name: 'Same Section Imaging Channels',
        selector: 'SAME_SECTION_IMAGING_CHANNELS',
        sortable: true,
        omit: true,
    },
    {
        name: 'Same Section Imaging Modality',
        selector: 'SAME_SECTION_IMAGING_MODALITY',
        sortable: true,
        omit: true,
    },

    // ── Spatial Level 4 specific ────────────────────────────────────────────────
    { name: 'Has Image', selector: 'HAS_IMAGE', sortable: true, omit: true },
    { name: 'Image Type', selector: 'IMAGE_TYPE', sortable: true, omit: true },
    { name: 'Cell Types', selector: 'CELL_TYPES', sortable: true, omit: true },
    {
        name: 'Has Raw Array',
        selector: 'HAS_RAW_ARRAY',
        sortable: true,
        omit: true,
    },
    {
        name: 'Has Normalised Array',
        selector: 'HAS_NORMALISED_ARRAY',
        sortable: true,
        omit: true,
    },
    {
        name: 'Normalisation Method',
        selector: 'NORMALISATION_METHOD',
        sortable: true,
        omit: true,
    },
    {
        name: 'Has Cell Type Calling',
        selector: 'HAS_CELL_TYPE_CALLING',
        sortable: true,
        omit: true,
    },
    {
        name: 'Cell Type Calling Method',
        selector: 'CELL_TYPE_CALLING_METHOD',
        sortable: true,
        omit: true,
    },
    {
        name: 'Tool Compatibility',
        selector: 'TOOL_COMPATIBILITY',
        sortable: true,
        omit: true,
    },
];

const CASE_COLUMNS: IEnhancedDataTableColumn<TableRow>[] = [
    {
        name: 'HTAN Participant ID',
        selector: 'HTAN_PARTICIPANT_ID',
        sortable: true,
    },
    { name: 'Atlas Name', selector: 'atlas_name', sortable: true },
    {
        name: 'Age at Diagnosis (years)',
        selector: (row) => {
            const days = Number(row.AGE_IN_DAYS_AT_DIAGNOSIS);
            return Number.isFinite(days) ? (days / 365.25).toFixed(2) : '';
        },
        sortable: true,
    },
    {
        name: 'Primary Diagnosis',
        selector: 'PRIMARY_DIAGNOSIS_NCI_THESAURUS_ID',
        sortable: true,
    },
    {
        name: 'Tissue or Organ of Origin',
        selector: (row) =>
            formatCodeNamePairs(
                row.TISSUE_OR_ORGAN_OF_ORIGIN_UBERON_CODE,
                row.TISSUE_OR_ORGAN_OF_ORIGIN_UBERON_NAME
            ),
        getSearchValue: (row) =>
            formatCodeNamePairs(
                row.TISSUE_OR_ORGAN_OF_ORIGIN_UBERON_CODE,
                row.TISSUE_OR_ORGAN_OF_ORIGIN_UBERON_NAME
            ),
        sortable: true,
    },
    { name: 'Sex', selector: 'SEX', sortable: true },
    { name: 'Ethnic Group', selector: 'ETHNIC_GROUP', sortable: true },
    { name: 'Race', selector: 'RACE', sortable: true },
    { name: 'Vital Status', selector: 'VITAL_STATUS', sortable: true },
    { name: 'Tumor Grade', selector: 'TUMOR_GRADE', sortable: true },
    {
        name: 'Last Known Disease Status',
        selector: 'LastKnownDiseaseStatus',
        sortable: true,
        omit: true,
    },
    {
        name: 'Days to Last Known Disease Status',
        selector: 'DaystoLastKnownDiseaseStatus',
        sortable: true,
        omit: true,
    },
    {
        name: 'Treatment Type',
        selector: (row) => formatValue(row.TREATMENT_TYPE),
        getSearchValue: (row) => formatValue(row.TREATMENT_TYPE),
        sortable: true,
        omit: true,
    },
    {
        name: 'Gender Identity',
        selector: 'GENDER_IDENTITY',
        sortable: true,
        omit: true,
    },
    {
        name: 'Cause of Death',
        selector: 'CAUSE_OF_DEATH',
        sortable: true,
        omit: true,
    },
    {
        name: 'Cause of Death Source',
        selector: 'CAUSE_OF_DEATH_SOURCE',
        sortable: true,
        omit: true,
    },
    {
        name: 'Age in Days at Death',
        selector: 'AGE_IN_DAYS_AT_DEATH',
        sortable: true,
        omit: true,
    },
    {
        name: 'Age in Days at Last Known Survival Status',
        selector: 'AGE_IN_DAYS_AT_LAST_KNOWN_SURVIVAL_STATUS',
        sortable: true,
        omit: true,
    },
    {
        name: 'Method of Diagnosis',
        selector: 'MethodofDiagnosis',
        sortable: true,
        omit: true,
    },
    {
        name: 'Metastasis at Diagnosis',
        selector: 'MetastasisatDiagnosis',
        sortable: true,
        omit: true,
    },
    {
        name: 'Classification of Tumor',
        selector: 'ClassificationofTumor',
        sortable: true,
        omit: true,
    },
    {
        name: 'Gleason Grade Group',
        selector: 'GLEASON_GRADE_GROUP',
        sortable: true,
        omit: true,
    },
    {
        name: 'AJCC Clinical T',
        selector: 'AJCCClinicalT',
        sortable: true,
        omit: true,
    },
    {
        name: 'AJCC Clinical N',
        selector: 'AJCCClinicalN',
        sortable: true,
        omit: true,
    },
    {
        name: 'AJCC Clinical M',
        selector: 'AJCCClinicalM',
        sortable: true,
        omit: true,
    },
    {
        name: 'AJCC Clinical Stage',
        selector: 'AJCCClinicalStage',
        sortable: true,
        omit: true,
    },
    {
        name: 'AJCC Staging System Edition',
        selector: 'AJCCStagingSystemEdition',
        sortable: true,
        omit: true,
    },
    {
        name: 'Molecular Analysis Method',
        selector: 'MOLECULAR_ANALYSIS_METHOD',
        sortable: true,
        omit: true,
    },
    {
        name: 'Gene Symbol',
        selector: 'GENE_SYMBOL',
        sortable: true,
        omit: true,
    },
    {
        name: 'Test Result',
        selector: 'TEST_RESULT',
        sortable: true,
        omit: true,
    },
    { name: 'Synapse ID', selector: 'synapseId', sortable: true, omit: true },
    { name: 'Atlas ID', selector: 'atlasid', sortable: true, omit: true },
    {
        name: 'Component',
        selector: 'Component',
        sortable: true,
        omit: true,
    },
];

const SPECIMEN_COLUMNS: IEnhancedDataTableColumn<TableRow>[] = [
    {
        name: 'HTAN Biospecimen ID',
        selector: 'HTAN_BIOSPECIMEN_ID',
        sortable: true,
    },
    { name: 'Atlas Name', selector: 'atlas_name', sortable: true },
    {
        name: 'HTAN Parent ID',
        selector: (row) => row.HTAN_PARENT_ID ?? row.ParentID,
        getSearchValue: (row) => row.HTAN_PARENT_ID ?? row.ParentID,
        sortable: true,
    },
    {
        name: 'Timepoint Label',
        selector: 'TimepointLabel',
        sortable: true,
        omit: true,
    },
    {
        name: 'Participant ID',
        selector: 'HTAN_PARTICIPANT_ID',
        sortable: true,
        omit: true,
    },
    {
        name: 'Source HTAN Biospecimen ID',
        selector: 'SourceHTANBiospecimenID',
        sortable: true,
        omit: true,
    },
    {
        name: 'Adjacent Biospecimen IDs',
        selector: 'AdjacentBiospecimenIDs',
        sortable: true,
        omit: true,
    },
    {
        name: 'Biospecimen Type',
        selector: (row) => row.BIOSPECIMEN_TYPE ?? row.BiospecimenType,
        getSearchValue: (row) => row.BIOSPECIMEN_TYPE ?? row.BiospecimenType,
        sortable: true,
    },
    {
        name: 'Acquisition Method Type',
        selector: (row) =>
            row.ACQUISITION_METHOD_TYPE ?? row.AcquisitionMethodType,
        getSearchValue: (row) =>
            row.ACQUISITION_METHOD_TYPE ?? row.AcquisitionMethodType,
        sortable: true,
    },
    {
        name: 'Storage Method',
        selector: (row) => row.PRESERVATION_MEDIUM ?? row.StorageMethod,
        getSearchValue: (row) => row.PRESERVATION_MEDIUM ?? row.StorageMethod,
        sortable: true,
    },
    {
        name: 'Preservation Method',
        selector: (row) => row.PRESERVATION_METHOD,
        getSearchValue: (row) => row.PRESERVATION_METHOD,
        sortable: true,
        omit: true,
    },
    {
        name: 'Site Data Source',
        selector: 'SiteDataSource',
        sortable: true,
        omit: true,
    },
    {
        name: 'Processing Location',
        selector: 'ProcessingLocation',
        sortable: true,
        omit: true,
    },
    {
        name: 'Degree of Dysplasia',
        selector: 'DegreeofDysplasia',
        sortable: true,
        omit: true,
    },
    {
        name: 'Percent Necrosis',
        selector: 'PercentNecrosis',
        sortable: true,
        omit: true,
    },
    {
        name: 'Percent Normal Cells',
        selector: 'PercentNormalCells',
        sortable: true,
        omit: true,
    },
    {
        name: 'Percent Tumor Cells',
        selector: 'PercentTumorCells',
        sortable: true,
        omit: true,
    },
    {
        name: 'Percent Tumor Nuclei',
        selector: 'PercentTumorNuclei',
        sortable: true,
        omit: true,
    },
    {
        name: 'Slicing Method',
        selector: 'SlicingMethod',
        sortable: true,
        omit: true,
    },
    {
        name: 'Method of Nucleic Acid Isolation',
        selector: 'MethodofNucleicAcidIsolation',
        sortable: true,
        omit: true,
    },
    {
        name: 'Analyte Type',
        selector: 'AnalyteType',
        sortable: true,
        omit: true,
    },
    {
        name: 'Fixation Duration',
        selector: 'FixationDuration',
        sortable: true,
        omit: true,
    },
    {
        name: 'Histologic Morphology Code',
        selector: 'HistologicMorphologyCode',
        sortable: true,
        omit: true,
    },
    {
        name: 'Section Thickness Value',
        selector: 'SectionThicknessValue',
        sortable: true,
        omit: true,
    },
    {
        name: 'Sectioning Days from Index',
        selector: 'SectioningDaysfromIndex',
        sortable: true,
        omit: true,
    },
    {
        name: 'Shipping Condition Type',
        selector: 'ShippingConditionType',
        sortable: true,
        omit: true,
    },
    {
        name: 'Slide Charge Type',
        selector: 'SlideChargeType',
        sortable: true,
        omit: true,
    },
    {
        name: 'Specimen Laterality',
        selector: 'SpecimenLaterality',
        sortable: true,
        omit: true,
    },
    {
        name: 'Tumor Tissue Type',
        selector: 'TumorTissueType',
        sortable: true,
        omit: true,
    },
    {
        name: 'Collection Days from Index',
        selector: (row) => row.CollectionDaysfromIndex,
        sortable: true,
        omit: true,
    },
    {
        name: 'Processing Days from Index',
        selector: (row) => row.ProcessingDaysfromIndex,
        sortable: true,
        omit: true,
    },
    {
        name: 'Biospecimen Dimension 1',
        selector: 'BiospecimenDimension1',
        sortable: true,
        omit: true,
    },
    {
        name: 'Biospecimen Dimension 2',
        selector: 'BiospecimenDimension2',
        sortable: true,
        omit: true,
    },
    {
        name: 'Section Number in Sequence',
        selector: 'SectionNumberinSequence',
        sortable: true,
        omit: true,
    },
    {
        name: 'Is Tissue Section',
        selector: 'IS_TISSUE_SECTION',
        sortable: true,
        omit: true,
    },
    {
        name: 'ICD-10 Disease Code',
        selector: 'ICD_10_DISEASE_CODE',
        sortable: true,
        omit: true,
    },
    {
        name: 'Site of Resection or Biopsy',
        selector: 'SITE_OF_RESECTION_OR_BIOPSY',
        sortable: true,
        omit: true,
    },
    {
        name: 'Specimen Cellular Architecture',
        selector: 'SPECIMEN_CELLULAR_ARCHITECTURE',
        sortable: true,
        omit: true,
    },
    {
        name: 'Preservation Method Temperature',
        selector: 'PRESERVATION_METHOD_TEMPERATURE',
        sortable: true,
        omit: true,
    },
    {
        name: 'HTAN Parent ID (Legacy)',
        selector: 'HTANParentID',
        sortable: true,
        omit: true,
    },
    {
        name: 'Parent ID (Legacy)',
        selector: 'ParentID',
        sortable: true,
        omit: true,
    },
    {
        name: 'Biospecimen Type (Legacy)',
        selector: 'BiospecimenType',
        sortable: true,
        omit: true,
    },
    {
        name: 'Acquisition Method Type (Legacy)',
        selector: 'AcquisitionMethodType',
        sortable: true,
        omit: true,
    },
    {
        name: 'Storage Method (Legacy)',
        selector: 'StorageMethod',
        sortable: true,
        omit: true,
    },
    { name: 'Synapse ID', selector: 'synapseId', sortable: true, omit: true },
    { name: 'Atlas ID', selector: 'atlasid', sortable: true, omit: true },
    {
        name: 'Component',
        selector: 'Component',
        sortable: true,
        omit: true,
    },
];

const ATLAS_COLUMNS: IEnhancedDataTableColumn<AtlasSummaryRow>[] = [
    { name: 'Atlas Name', selector: 'atlas_name', sortable: true },
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

function AtlasSummaryTable({
    data,
    selectedAtlasNames,
    onAtlasSelectionChange,
}: {
    data: AtlasSummaryRow[];
    selectedAtlasNames: string[];
    onAtlasSelectionChange: (selected: string[]) => void;
}) {
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
            selectableRows={true}
            selectableRowSelected={(row: AtlasSummaryRow) =>
                selectedAtlasNames.includes(row.atlas_name)
            }
            onSelectedRowsChange={(state: {
                selectedRows: AtlasSummaryRow[];
            }) =>
                onAtlasSelectionChange(
                    state.selectedRows.map((r) => r.atlas_name)
                )
            }
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
    const tabFromProps = (props.getTab?.() || ExploreTab.ATLAS) as ExploreTab;
    const [activeTab, setActiveTab] = useState<ExploreTab>(tabFromProps);
    const [filterOptions, setFilterOptions] = useState<CountByType[]>([]);
    const [files, setFiles] = useState<TableRow[]>([]);
    const [cases, setCases] = useState<TableRow[]>([]);
    const [specimens, setSpecimens] = useState<TableRow[]>([]);
    const [atlasFiles, setAtlasFiles] = useState<TableRow[]>([]);
    const [atlasCases, setAtlasCases] = useState<TableRow[]>([]);
    const [atlasSpecimens, setAtlasSpecimens] = useState<TableRow[]>([]);
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

    const selectedAtlasNames = useMemo(
        () =>
            selectedFilters
                .filter((f) => f.group === Phase2AttributeNames.AtlasName)
                .map((f) => f.value),
        [selectedFilters]
    );

    const handleAtlasSelectionChange = (selected: string[]) => {
        const nonAtlasFilters = selectedFilters.filter(
            (f) => f.group !== Phase2AttributeNames.AtlasName
        );
        const atlasFilters = selected.map((atlasName) => ({
            group: Phase2AttributeNames.AtlasName,
            value: atlasName,
        }));
        const newFilters = [...nonAtlasFilters, ...atlasFilters];
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

                // Helper: filter string that excludes a given attribute's own
                // filter — so each dropdown shows all its own options (with
                // zero-count items grayed out) but counts reflect other filters.
                const fs = (excludeGroup: Phase2AttributeNames) =>
                    getFilterString2(
                        selectedFilters.filter((f) => f.group !== excludeGroup),
                        unfilteredCounts
                    );

                const nonAtlasFilterString = fs(Phase2AttributeNames.AtlasName);

                // Fetch per-filter dropdown counts (each attribute excludes
                // its own group so all its options stay visible)
                const filterCountsQuery =
                    filterString === ''
                        ? Promise.resolve(unfilteredCounts)
                        : doQuery<CountByType>(
                              countsByTypeQuery2({
                                  genderFilterString: fs(
                                      Phase2AttributeNames.SEX
                                  ),
                                  raceFilterString: fs(
                                      Phase2AttributeNames.RACE
                                  ),
                                  primaryDiagnosisFilterString: fs(
                                      Phase2AttributeNames.PRIMARY_DIAGNOSIS_NCI_THESAURUS_ID
                                  ),
                                  ethnicityFilterString: fs(
                                      Phase2AttributeNames.ETHNIC_GROUP
                                  ),
                                  tissueOrOrganOfOriginFilterString: fs(
                                      Phase2AttributeNames.TISSUE_OR_ORGAN_OF_ORIGIN_UBERON_CODE
                                  ),
                                  levelFilterString: fs(
                                      Phase2AttributeNames.level
                                  ),
                                  assayNameFilterString: fs(
                                      Phase2AttributeNames.assayName
                                  ),
                                  treatmentTypeFilterString: fs(
                                      Phase2AttributeNames.TREATMENT_TYPE
                                  ),
                                  fileFormatFilterString: fs(
                                      Phase2AttributeNames.FileFormat
                                  ),
                                  atlasNameFilterString: nonAtlasFilterString,
                              }),
                              phase2Client
                          );

                const [
                    filteredCounts,
                    fileRows,
                    caseRows,
                    specimenRows,
                    atlasFileRows,
                    atlasCaseRows,
                    atlasSpecimenRows,
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
                    doQuery<TableRow>(
                        fileQuery2 + nonAtlasFilterString,
                        phase2Client
                    ),
                    doQuery<TableRow>(
                        caseQuery2({ filterString: nonAtlasFilterString }),
                        phase2Client
                    ),
                    doQuery<TableRow>(
                        specimenQuery2({ filterString: nonAtlasFilterString }),
                        phase2Client
                    ),
                ]);

                if (!active) return;

                // Merge filtered counts against the unfiltered baseline so
                // zero-count options are preserved (shown grayed-out) rather
                // than disappearing from dropdowns.
                const filteredCountsMap = new Map(
                    filteredCounts.map((o) => [`${o.val}__${o.type}`, o])
                );
                const mergedCounts: CountByType[] = unfilteredCounts.map(
                    (opt) => {
                        const key = `${opt.val}__${opt.type}`;
                        return filteredCountsMap.has(key)
                            ? filteredCountsMap.get(key)!
                            : { ...opt, count: 0 };
                    }
                );

                setFilterOptions(mergedCounts);
                setFiles(fileRows);
                setCases(caseRows);
                setSpecimens(specimenRows);
                setAtlasFiles(atlasFileRows);
                setAtlasCases(atlasCaseRows);
                setAtlasSpecimens(atlasSpecimenRows);
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

        atlasCases.forEach((row) =>
            increment(String(row.atlas_name || ''), 'caseCount')
        );
        atlasSpecimens.forEach((row) =>
            increment(String(row.atlas_name || ''), 'biospecimenCount')
        );
        atlasFiles.forEach((row) =>
            increment(String(row.atlas_name || ''), 'fileCount')
        );

        return Array.from(atlasCounts.entries())
            .map(([atlas_name, counts]) => ({ atlas_name, ...counts }))
            .sort((a, b) => a.atlas_name.localeCompare(b.atlas_name));
    }, [atlasCases, atlasSpecimens, atlasFiles]);

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
                            <AtlasSummaryTable
                                data={atlasSummaryRows}
                                selectedAtlasNames={selectedAtlasNames}
                                onAtlasSelectionChange={
                                    handleAtlasSelectionChange
                                }
                            />
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
                                defaultSortField="Filename"
                            />
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default Explore2;
