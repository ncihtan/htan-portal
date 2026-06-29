import _ from 'lodash';
import { getFileBase } from '@htan/data-portal-utils';
import {
    AutoMinerva,
    BaseSerializableEntity,
    CrdcGcAsset,
    Entity,
    FileViewerName,
    IdcImagingAsset,
} from './entity';

import CELLXGENE_MAPPINGS from '../assets/cellxgene-mappings.json';
import UCSCXENA_MAPPINGS from '../assets/ucscxena-mappings.json';
import ISBCGC_MAPPINGS from '../assets/isbcgc-mappings.json';
import CUSTOM_MINERVA_STORY_MAPPINGS from '../assets/minerva-story-mappings.json';
import AUTOMINERVA_ASSETS from '../assets/htan-imaging-assets.json';
import IDC_IMAGING_ASSETS from '../assets/idc-imaging-assets.json';
import CRDCGC_ASSETS from '../assets/crdcgc_drs_mapping.json';

const IDC_MAPPINGS: {
    [fileId: string]: IdcImagingAsset;
} = _.keyBy<IdcImagingAsset>(IDC_IMAGING_ASSETS, 'ContainerIdentifier');

const CRDCGC_MAPPINGS: {
    [fileId: string]: CrdcGcAsset;
} = _.keyBy<CrdcGcAsset>(CRDCGC_ASSETS, 'HTAN_Data_File_ID');

const AUTOMINERVA_MAPPINGS: {
    [synapseId: string]: AutoMinerva;
} = _.keyBy<AutoMinerva>(AUTOMINERVA_ASSETS, 'synid');

// Pure lookup for a file's CRDC-GC asset. Unlike reading `file.viewers?.crdcGc`,
// this does not depend on addViewers() having already mutated the file, so it is
// safe to use for download availability regardless of render/pagination state.
export function getCrdcGcAsset(
    file: BaseSerializableEntity,
    crdcGcMappings: { [fileId: string]: CrdcGcAsset } = CRDCGC_MAPPINGS
): CrdcGcAsset | undefined {
    return crdcGcMappings[file.DataFileID];
}

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
    crdcGcMappings: { [fileId: string]: CrdcGcAsset } = CRDCGC_MAPPINGS
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
        [FileViewerName.crdcGc]: crdcGcMappings[file.DataFileID],
    };
}

export function postProcessFiles(files: Entity[]) {
    // we need to parse certain fields of the entity data because everything is stored as plain text in the database
    _.forEach(files, (f: Entity) => {
        f.imageChannelMetadata = !_.isEmpty(f.imageChannelMetadata)
            ? JSON.parse(f.imageChannelMetadata!.toString())
            : f.imageChannelMetadata;
    });

    return files;
}
