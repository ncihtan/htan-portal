import {
    AutoMinerva,
    BaseSerializableEntity,
    CdsAsset,
    DownloadSourceCategory,
    FileViewerName,
    IdcImagingAsset,
} from '@htan/data-portal-commons';
// import UCSCXENA_MAPPINGS from "../data/ucscxena-mappings.json";
// import CELLXGENE_MAPPINGS from "../data/cellxgene-mappings.json";
// import ISBCGC_MAPPINGS from "../data/isbcgc-mappings.json";

import CELLXGENE_MAPPINGS from '../data/cellxgene-mappings.json';
import UCSCXENA_MAPPINGS from '../data/ucscxena-mappings.json';
import ISBCGC_MAPPINGS from '../data/isbcgc-mappings.json';
import CUSTOM_MINERVA_STORY_MAPPINGS from '../data/minerva-story-mappings.json';
import AUTOMINERVA_ASSETS from '../data/htan-imaging-assets.json';
import IDC_IMAGING_ASSETS from '../data/idc-imaging-assets.json';
import CDS_ASSETS from '../data/cds_drs_mapping.json';

const IDC_MAPPINGS: {
    [fileId: string]: IdcImagingAsset;
} = _.keyBy<IdcImagingAsset>(IDC_IMAGING_ASSETS, 'ContainerIdentifier');

const CDS_MAPPINGS: {
    [fileId: string]: CdsAsset;
} = _.keyBy<CdsAsset>(CDS_ASSETS, 'HTAN_Data_File_ID');

const AUTOMINERVA_MAPPINGS: {
    [synapseId: string]: AutoMinerva;
} = _.keyBy<AutoMinerva>(AUTOMINERVA_ASSETS, 'synid');

import { getFileBase } from '@htan/data-portal-utils';
import _ from 'lodash';

export function addViewers(
    file: BaseSerializableEntity,
    ucscXenaMappings: { [fileId: string]: string } = UCSCXENA_MAPPINGS,
    cellxgeneMappings: { [filename: string]: string } = CELLXGENE_MAPPINGS,
    isbcgcMappings: { [synapseId: string]: string } = ISBCGC_MAPPINGS,
    customMinervaStoryMappings: {
        [filename: string]: string;
    } = CUSTOM_MINERVA_STORY_MAPPINGS,
    thumbNailAndAutominervaMappings: {
        [synapseId: string]: AutoMinerva;
    } = AUTOMINERVA_MAPPINGS,
    idcMappings: { [fileId: string]: IdcImagingAsset } = IDC_MAPPINGS,
    cdsMappings: { [fileId: string]: CdsAsset } = CDS_MAPPINGS
) {
    const filename = getFileBase(file.Filename);
    const synapseId = file.synapseId || '';

    file.viewers = {
        [FileViewerName.ucscXena]: ucscXenaMappings[file.DataFileID],
        [FileViewerName.cellxgene]: cellxgeneMappings[filename],
        [FileViewerName.isbcgc]: isbcgcMappings[synapseId],
        [FileViewerName.customMinerva]: customMinervaStoryMappings[filename],
        [FileViewerName.autoMinerva]:
            thumbNailAndAutominervaMappings[synapseId],
        [FileViewerName.idc]: idcMappings[file.DataFileID],
        [FileViewerName.cds]: cdsMappings[file.DataFileID],
    };
}

export function addDownloadSourcesInfo(
    file: BaseSerializableEntity,
    dbgapImgSynapseSet: Set<string>
) {
    if (
        _.some(['bulk', '-seq'], (assay) =>
            file.assayName?.toLowerCase().includes(assay)
        ) &&
        (file.level === 'Level 1' || file.level === 'Level 2')
    ) {
        // BulkRNA, BulkWES, ScRNA, ScATAC, HI-C, BulkMethylation, 10xVisiumSpatialTranscriptomics-RNA-seq Levels 1 & 2
        // as specified in released.entities table (CDS_Release) column
        // TODO: bai files are actually not on CDS, but we might want to remove
        // them from the portal listing entirely so assume they are there
        file.isRawSequencing = true;
        if (
            (file.synapseId && file.viewers?.cds?.drs_uri) ||
            file.Filename.endsWith('bai')
        ) {
            file.downloadSource = DownloadSourceCategory.dbgap;
        } else {
            file.downloadSource = DownloadSourceCategory.comingSoon;
        }
    } else {
        file.isRawSequencing = false;
        if (file.synapseId && dbgapImgSynapseSet.has(file.synapseId)) {
            // Level 2 imaging data is open access
            // ImagingLevel2, SRRSImagingLevel2 as specified in released.entities table (CDS_Release) column
            if (file.viewers?.cds?.drs_uri) {
                file.downloadSource = DownloadSourceCategory.cds;
            } else {
                file.downloadSource = DownloadSourceCategory.comingSoon;
            }
        } else if (
            file.Component === 'OtherAssay' &&
            file.AssayType?.toLowerCase() === '10x visium'
        ) {
            // 10X Visium raw data will go to dbGap, but isn't available yet
            file.downloadSource = DownloadSourceCategory.dbgap;
        } else if (
            // ElectronMicroscopy, RPPA, Slide-seq, MassSpectrometry, ExSeqMinimal (all levels)
            _.some(
                [
                    'electron microscopy',
                    'rppa',
                    'slide-seq',
                    'mass spectrometry',
                    'exseq',
                ],
                (assay) => file.assayName?.toLowerCase().includes(assay)
            ) ||
            // Level 3 & 4 all assays
            _.some(
                ['Level 3', 'Level 4', 'Auxiliary', 'Other'],
                (level) => file.level === level
            ) ||
            // Auxiliary & Accessory files/folders
            _.some(
                ['AccessoryManifest', 'OtherAssay'],
                (component) => file.Component === component
            )
        ) {
            file.downloadSource = DownloadSourceCategory.synapse;
        } else {
            file.downloadSource = DownloadSourceCategory.comingSoon;
        }
    }
}
