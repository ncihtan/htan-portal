import _ from 'lodash';
import { getFileBase } from '@htan/data-portal-utils';
import {
    AutoMinerva,
    BaseSerializableEntity,
    CdsAsset,
    FileViewerName,
    IdcImagingAsset,
} from './entity';

import CELLXGENE_MAPPINGS from '../assets/cellxgene-mappings.json';
import UCSCXENA_MAPPINGS from '../assets/ucscxena-mappings.json';
import ISBCGC_MAPPINGS from '../assets/isbcgc-mappings.json';
import CUSTOM_MINERVA_STORY_MAPPINGS from '../assets/minerva-story-mappings.json';
import AUTOMINERVA_ASSETS from '../assets/htan-imaging-assets.json';
import IDC_IMAGING_ASSETS from '../assets/idc-imaging-assets.json';
import CDS_ASSETS from '../assets/cds_drs_mapping.json';

const IDC_MAPPINGS: {
    [fileId: string]: IdcImagingAsset;
} = _.keyBy<IdcImagingAsset>(IDC_IMAGING_ASSETS, 'ContainerIdentifier');

const CDS_MAPPINGS: {
    [fileId: string]: CdsAsset;
} = _.keyBy<CdsAsset>(CDS_ASSETS, 'HTAN_Data_File_ID');

const AUTOMINERVA_MAPPINGS: {
    [synapseId: string]: AutoMinerva;
} = _.keyBy<AutoMinerva>(AUTOMINERVA_ASSETS, 'synid');

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
