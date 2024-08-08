import _ from 'lodash';

// this import causes compiler to crash due to the size of syn_data.json
// we need to use fs instead
// import getData from '../lib/getData';

import fs, { readFileSync } from 'fs';
import csvToJson from 'csvtojson';
import atlasJson from './atlases.json';
import {
    AccessoryManifest,
    Atlas,
    AtlasMeta,
    AutoMinerva,
    BaseSerializableEntity,
    CdsAsset,
    DataFileID,
    DownloadSourceCategory,
    Entity,
    FileViewerName,
    IdcImagingAsset,
    PublicationManifest,
    ReleaseEntity,
    SerializableEntity,
} from '../packages/data-portal-commons/src/lib/entity';
import {
    HTANAttributeNames,
    HTANToGenericAttributeMap,
    LoadDataResult,
} from '../packages/data-portal-commons/src/lib/types';
import {
    SynapseAtlas,
    SynapseData,
    SynapseRecords,
} from '../packages/data-portal-commons/src/lib/synapse';
import { isLowestLevel } from '../packages/data-portal-commons/src/lib/isLowestLevel';
import {
    fetchPublicationSummaries,
    getPublicationAssociatedParentDataFileIDs,
    getPublicationPubMedID,
    getPublicationUid,
} from '../packages/data-portal-commons/src/lib/publicationHelpers';
import {
    fetchAndProcessSchemaData,
    getAttributeToSchemaIdMap,
    SchemaDataById,
} from '../packages/data-portal-schema/src/lib/dataSchemaHelpers';
import { getFileBase } from '../packages/data-portal-utils/src/lib/file';

import CELLXGENE_MAPPINGS from './cellxgene-mappings.json';
import UCSCXENA_MAPPINGS from './ucscxena-mappings.json';
import ISBCGC_MAPPINGS from './isbcgc-mappings.json';
import CUSTOM_MINERVA_STORY_MAPPINGS from './minerva-story-mappings.json';
import AUTOMINERVA_ASSETS from './htan-imaging-assets.json';
import IDC_IMAGING_ASSETS from './idc-imaging-assets.json';
import CDS_ASSETS from './cds_drs_mapping.json';

const IDC_MAPPINGS: {
    [fileId: string]: IdcImagingAsset;
} = _.keyBy<IdcImagingAsset>(IDC_IMAGING_ASSETS, 'ContainerIdentifier');

const CDS_MAPPINGS: {
    [fileId: string]: CdsAsset;
} = _.keyBy<CdsAsset>(CDS_ASSETS, 'HTAN_Data_File_ID');

const AUTOMINERVA_MAPPINGS: {
    [synapseId: string]: AutoMinerva;
} = _.keyBy<AutoMinerva>(AUTOMINERVA_ASSETS, 'synid');

interface ImagingMetadata {
    HTAN_Data_File_ID: string;
    Imaging_Assay_Type: string;
}

interface SynapsePublication {
    'HTAN Center ID': string;
}

async function writeProcessedFile() {
    const synapseJson = getSynData();
    const schemaData = await fetchAndProcessSchemaData();
    const entitiesById = await getEntitiesById();
    const imagingLevel1ById = await getImagingLevel1ById();
    const imagingLevel2ById = await getImagingLevel2ById();

    const activeAtlases = atlasJson; //atlasJson.filter((a) => a.htan_id === 'hta7');

    // TODO this is a workaround until we actually fetch publication manifest data from Synapse,
    //  for now we read it from a JSON file and append it to the synapse JSON we have
    addPublicationsAsSynapseRecords(synapseJson, getPublicationData());

    const processed: LoadDataResult = processSynapseJSON(
        synapseJson,
        schemaData,
        activeAtlases as AtlasMeta[],
        entitiesById,
        imagingLevel1ById,
        imagingLevel2ById
    );

    // we need to fetch publication summaries after we process the json,
    // because we need to know pubmed ids to query the external API
    processed.publicationSummaryByPubMedID = await fetchPublicationSummaries(
        _.values(processed.publicationManifestByUid).map(getPublicationPubMedID)
    );

    fs.writeFileSync(
        'public/processed_syn_data.json',
        JSON.stringify(processed)
    );

    // create a separate file to store static publication page ids
    fs.writeFileSync(
        'pages/publications/static_page_ids.json',
        JSON.stringify(_.keys(processed.publicationManifestByUid), null, 2)
    );
}

function getSynData(): SynapseData {
    const data = readFileSync('public/syn_data.json', { encoding: 'utf8' });
    return JSON.parse(data);
}

function getPublicationData(): SynapsePublication[] {
    const data = readFileSync('data/publications_manifest_all.json', {
        encoding: 'utf8',
    });
    const publications = JSON.parse(data);
    publications.forEach(
        (publication: any) =>
            (publication[
                'Publication-associated HTAN Parent Data File ID'
            ] = publication[
                'Publication-associated HTAN Parent Data File ID'
            ].join(','))
    );
    return publications;
}

function addPublicationsAsSynapseRecords(
    synapseJson: SynapseData,
    publicationData: SynapsePublication[]
) {
    const publicationsById = getPublicationsAsSynapseRecordsByAtlasId(
        publicationData
    );

    _.forEach(publicationsById, (synapseRecords, atlasId) => {
        const atlas = synapseJson.atlases.find(
            (atlas) => atlas.htan_id === atlasId
        );
        if (atlas) {
            atlas[synapseRecords.data_schema] = synapseRecords;
        }
    });
}

function getPublicationsAsSynapseRecordsByAtlasId(
    publicationData: SynapsePublication[]
): { [htan_id: string]: SynapseRecords } {
    const publicationsById: { [htan_id: string]: SynapseRecords } = {};

    publicationData.forEach((publication) => {
        const centerId = publication['HTAN Center ID'];

        publicationsById[centerId] = publicationsById[centerId] || {
            data_schema: 'bts:PublicationManifest',
            column_order: _.keys(publication),
            record_list: [],
        };

        publicationsById[centerId].record_list.push({
            values: _.values(publication),
        });
    });

    return publicationsById;
}

async function getEntitiesById() {
    const rows = await csvToJson().fromFile('data/entities_v6_0.csv');
    return _.keyBy(rows, (row) => row.entityId);
}

async function getImagingLevel1ById() {
    const rows = await csvToJson().fromFile(
        'data/imaging_assay_type_level1.csv'
    );
    return _.keyBy(rows, (row) => row.HTAN_Data_File_ID);
}

async function getImagingLevel2ById() {
    const rows = await csvToJson().fromFile(
        'data/imaging_assay_type_level2.csv'
    );
    return _.keyBy(rows, (row) => row.HTAN_Data_File_ID);
}

function addReleaseInfo(
    file: BaseSerializableEntity,
    entitiesById: { [entityId: string]: ReleaseEntity }
) {
    if (file.synapseId && entitiesById[file.synapseId]) {
        file.releaseVersion = entitiesById[file.synapseId].Data_Release;
    }
}

function addImageChannelMetadata(
    file: BaseSerializableEntity,
    entitiesById: { [entityId: string]: ReleaseEntity }
) {
    const entity = file.synapseId ? entitiesById[file.synapseId] : undefined;
    const synapseId = entity?.channel_metadata_synapseId;
    const version = Number(entity?.channel_metadata_version);

    if (synapseId && version) {
        file.imageChannelMetadata = {
            synapseId,
            version,
        };
    }
}

function addViewers(
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

function getDbgapSynapseIds(entitiesById: {
    [entityId: string]: ReleaseEntity;
}) {
    return getReleaseSynapseIds(
        entitiesById,
        (e) => !_.isEmpty(e.CDS_Release) && !e.CDS_Release.endsWith('.img')
    );
}

function getDbgapImgSynapseIds(entitiesById: {
    [entityId: string]: ReleaseEntity;
}) {
    return getReleaseSynapseIds(entitiesById, (e) =>
        e.CDS_Release?.endsWith('.img')
    );
}

function getReleaseSynapseIds(
    entitiesById: { [entityId: string]: ReleaseEntity },
    predicate: (e: ReleaseEntity) => boolean
) {
    return _.values(entitiesById)
        .filter(predicate)
        .map((e) => e.entityId);
}

function addDownloadSourcesInfo(
    file: BaseSerializableEntity,
    dbgapSynapseSet: Set<string>,
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
        file.isRawSequencing = true;
        if (file.synapseId && dbgapSynapseSet.has(file.synapseId)) {
            file.downloadSource = DownloadSourceCategory.dbgap;
        } else {
            file.downloadSource = DownloadSourceCategory.comingSoon;
        }
    } else {
        file.isRawSequencing = false;
        if (file.synapseId && dbgapImgSynapseSet.has(file.synapseId)) {
            // Level 2 imaging data is open access
            // ImagingLevel2, SRRSImagingLevel2 as specified in released.entities table (CDS_Release) column
            if (
                file.level === 'Level 2' &&
                file.Component.startsWith('Imaging')
            ) {
                file.downloadSource = DownloadSourceCategory.cds;
            } else {
                file.downloadSource = DownloadSourceCategory.dbgap;
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

function processSynapseJSON(
    synapseJson: SynapseData,
    schemaData: SchemaDataById,
    AtlasMetaData: AtlasMeta[],
    entitiesById: { [entityId: string]: ReleaseEntity },
    imagingLevel1ById: { [fileId: string]: ImagingMetadata },
    imagingLevel2ById: { [fileId: string]: ImagingMetadata }
): LoadDataResult {
    const AtlasMetaMap = _.keyBy(AtlasMetaData, (a) => a.htan_id.toUpperCase());
    let flatData = extractEntitiesFromSynapseData(
        synapseJson,
        schemaData,
        AtlasMetaMap,
        imagingLevel1ById,
        imagingLevel2ById
    );

    flatData.forEach((d) => {
        Object.keys(HTANAttributeNames).forEach((attribute) => {
            const attr: HTANAttributeNames = (HTANAttributeNames as any)[
                attribute
            ];
            (d as any)[HTANToGenericAttributeMap[attr]] = (d as any)[attr];
            // TODO delete original ref?
        });

        /* @ts-ignore */
        // if (d.HTANParentID) {
        //     /* @ts-ignore */
        //     d.ParentID = d.HTANParentID;
        // }
    });

    flatData
        .filter((obj) => obj.Component === 'AccessoryManifest')
        .forEach((entity) => {
            const accessory = (entity as unknown) as AccessoryManifest;
            entity.Filename = accessory.DatasetName;
            entity.synapseId = accessory.AccessorySynapseID;
            entity.ParentDataFileID =
                accessory.AccessoryAssociatedParentDataFileID;
        });

    const publications: PublicationManifest[] = (flatData.filter(
        (obj) => obj.Component === 'PublicationManifest'
    ) as unknown) as PublicationManifest[];

    const publicationParentDataFileIdsByUid = _(publications)
        .keyBy(getPublicationUid)
        .mapValues((p) => new Set(getPublicationAssociatedParentDataFileIDs(p)))
        .value();

    // add publication id
    flatData.forEach((f) => {
        _.forEach(
            publicationParentDataFileIdsByUid,
            (parentDataFileIDs, uid) => {
                if (parentDataFileIDs.has(f.DataFileID)) {
                    f.publicationIds = f.publicationIds || [];
                    f.publicationIds.push(uid);
                }
            }
        );
    });

    //flatData = flatData.filter((f) => f.atlasid === 'HTA7');

    // split entity into 2 separate entities, Diagnosis and Demographics, if component is 'SRRSClinicalDataTier2'
    flatData = _.flatten(
        flatData.map((d) => {
            if (d.Component === 'SRRSClinicalDataTier2') {
                // TODO figure out where these should go (demographics vs diagnosis)
                //  we can't show these at this point because these are only defined in SRRSClinicalDataTier2 schema,
                //  we don't have these in Diagnosis or Demographics schema.
                // [
                //     'bts:TimepointLabel', // ???
                //     'bts:StartDaysfromIndex', // ???
                //     'bts:StopDaysfromIndex', // ???
                //     'bts:EducationLevel', // Demographics
                //     'bts:CountryofBirth', // Demographics
                //     'bts:MedicallyUnderservedArea', // Demographics
                //     'bts:RuralvsUrban', // Demographics
                //     'bts:CancerIncidence', // ???
                //     'bts:CancerIncidenceLocation', // ???
                //     'bts:DaystoRecurrence', // Diagnosis
                //     'bts:NCIAtlasCancerSite', // Dia
                //     'bts:PackYearsSmoked', // ???
                //     'bts:YearsSmoked', // ???
                //     'bts:DaystoFollowUp', // Dia
                //     'bts:GeneSymbol', // Dia
                //     'bts:MolecularAnalysisMethod', // Dia
                //     'bts:TestResult', // Dia
                //     'bts:TreatmentType' // Dia
                // ]

                const demographics = {
                    synapseId: d.synapseId,
                    Component: 'Demographics',
                    assayName: 'Demographics',
                    ParticipantID: d.ParticipantID,
                    EducationLevel: (d as any).EducationLevel,
                    CountryofBirth: (d as any).CountryofBirth,
                    MedicallyUnderservedArea: (d as any)
                        .MedicallyUnderservedArea,
                    RuralvsUrban: (d as any).RuralvsUrban,
                    Ethnicity: d.Ethnicity,
                    Gender: d.Gender,
                    Race: d.Race,
                    VitalStatus: (d as any).VitalStatus,
                    atlasid: d.atlasid,
                    atlas_name: d.atlas_name,
                    AtlasMeta: d.AtlasMeta,
                    level: d.level,
                };

                const diagnosis = {
                    synapseId: d.synapseId,
                    Component: 'Diagnosis',
                    assayName: 'Diagnosis',
                    ParticipantID: d.ParticipantID,
                    AgeatDiagnosis: d.AgeatDiagnosis,
                    DaystoLastFollowup: (d as any).DaystoLastFollowup,
                    DaystoLastKnownDiseaseStatus: (d as any)
                        .DaystoLastKnownDiseaseStatus,
                    DaystoRecurrence: (d as any).DaystoRecurrence,
                    LastKnownDiseaseStatus: (d as any).LastKnownDiseaseStatus,
                    Morphology: (d as any).Morphology,
                    PrimaryDiagnosis: d.PrimaryDiagnosis,
                    ProgressionorRecurrence: (d as any).ProgressionorRecurrence,
                    SiteofResectionorBiopsy: (d as any).SiteofResectionorBiopsy,
                    TissueorOrganofOrigin: d.TissueorOrganofOrigin,
                    NCIAtlasCancerSite: (d as any).NCIAtlasCancerSite,
                    TumorGrade: (d as any).TumorGrade,
                    DaystoFollowup: (d as any).DaystoFollowup,
                    GeneSymbol: (d as any).GeneSymbol,
                    MolecularAnalysisMethod: (d as any).MolecularAnalysisMethod,
                    TestResult: (d as any).TestResult,
                    TreatmentType: (d as any).TreatmentType,
                    TumorLargestDimensionDiameter: (d as any)
                        .TumorLargestDimensionDiameter,
                    atlasid: d.atlasid,
                    atlas_name: d.atlas_name,
                    AtlasMeta: d.AtlasMeta,
                    level: d.level,
                };

                return [diagnosis as any, demographics as any];
            } else {
                return d;
            }
        })
    );

    const files = flatData.filter((obj) => {
        return !!obj.Filename;
    });
    const filesById = _.keyBy(files, (f) => f.DataFileID);

    addPrimaryParents(files, filesById);

    const {
        biospecimenByBiospecimenID,
        diagnosisByParticipantID,
        demographicsByParticipantID,
        therapyByParticipantID,
    } = extractBiospecimensAndDiagnosisAndDemographicsAndTherapy(flatData);

    const dbgapSynapseSet = new Set<string>(getDbgapSynapseIds(entitiesById));
    const dbgapImgSynapseSet = new Set<string>(
        getDbgapImgSynapseIds(entitiesById)
    );

    const returnFiles = files.map((file) => {
        const parentData = getSampleAndPatientData(
            file,
            filesById,
            biospecimenByBiospecimenID,
            diagnosisByParticipantID,
            demographicsByParticipantID,
            therapyByParticipantID
        );

        (file as SerializableEntity).biospecimenIds = (
            parentData?.biospecimen || []
        ).map((b) => b.BiospecimenID);
        (file as SerializableEntity).diagnosisIds = (
            parentData?.diagnosis || []
        ).map((d) => d.ParticipantID);
        (file as SerializableEntity).demographicsIds = (
            parentData?.demographics || []
        ).map((d) => d.ParticipantID);
        (file as SerializableEntity).therapyIds = (
            parentData?.therapy || []
        ).map((d) => d.ParticipantID);

        addDownloadSourcesInfo(file, dbgapSynapseSet, dbgapImgSynapseSet);
        addReleaseInfo(file, entitiesById);
        addImageChannelMetadata(file, entitiesById);
        addViewers(file);
        return file as SerializableEntity;
    });
    //  .filter((f): f is SerializableEntity => !!f); // file should be defined (typescript doesnt understand (f=>f)
    //.filter((f) => f.diagnosisIds.length > 0); // files must have a diagnosis

    // TODO clean up when done
    // remove files that can't be downloaded unless it's imaging
    // .filter(
    //     (f) =>
    //         f.downloadSource !== DownloadSourceCategory.comingSoon ||
    //         f.ImagingAssayType
    // );

    // count cases and biospecimens for each atlas
    const filesByAtlas = _.groupBy(returnFiles, (f) => f.atlasid);
    const caseCountByAtlas = _.mapValues(filesByAtlas, (files) => {
        return _.chain(files)
            .flatMapDeep((f) => [...f.diagnosisIds, ...f.demographicsIds])
            .uniq()
            .value().length;
    });
    const biospecimenCountByAtlas = _.mapValues(filesByAtlas, (files) => {
        return _.chain(files)
            .flatMapDeep((f) => f.biospecimenIds)
            .uniq()
            .value().length;
    });

    const returnAtlases: Atlas[] = [];
    for (const atlas of synapseJson.atlases) {
        const AtlasMeta = AtlasMetaMap[atlas.htan_id.toUpperCase()];

        // atlases MUST have an entry in AtlasMetaMap
        if (AtlasMeta) {
            returnAtlases.push({
                htan_id: atlas.htan_id,
                htan_name: atlas.htan_name,
                AtlasMeta,
                num_biospecimens: biospecimenCountByAtlas[atlas.htan_id],
                num_cases: caseCountByAtlas[atlas.htan_id],
            });
        }
    }

    // unify certain assays under the same assay name
    _.forEach(returnFiles, (file) => {
        const assayNameLowerVase = file.assayName?.toLowerCase();
        // unify "10X Visium" assays
        if (assayNameLowerVase?.startsWith('10x visium')) {
            file.assayName = '10X Visium';
        }
        // unify "NanoString GeoMX DSP" assays
        else if (
            assayNameLowerVase
                ?.replace(/\s/g, '')
                .replace(/-/g, '')
                .includes('geomxdsp')
        ) {
            file.assayName = 'NanoString GeoMX DSP';
        }
    });

    return {
        files: returnFiles,
        atlases: returnAtlases,
        publicationManifestByUid: _.keyBy(publications, getPublicationUid),
        biospecimenByBiospecimenID: biospecimenByBiospecimenID as {
            [BiospecimenID: string]: SerializableEntity;
        },
        diagnosisByParticipantID: diagnosisByParticipantID as {
            [ParticipantID: string]: SerializableEntity;
        },
        demographicsByParticipantID: demographicsByParticipantID as {
            [ParticipantID: string]: SerializableEntity;
        },
        therapyByParticipantID: therapyByParticipantID as {
            [ParticipantID: string]: SerializableEntity;
        },
    };
}

function addPrimaryParents(
    files: BaseSerializableEntity[],
    filesByFileId: { [DataFileID: string]: BaseSerializableEntity }
) {
    files.forEach((f) => {
        findAndAddPrimaryParents(f, filesByFileId);
    });
}

function findAndAddPrimaryParents(
    f: BaseSerializableEntity,
    filesByFileId: { [DataFileID: string]: BaseSerializableEntity }
): DataFileID[] {
    if (f.primaryParents) {
        // recursive optimization:
        //  if we've already calculated f.primaryParents, just return it
        return f.primaryParents;
    }

    // otherwise, compute parents
    let primaryParents: DataFileID[] = [];

    if (f.ParentDataFileID && !isLowestLevel(f)) {
        // if there's a parent, traverse "upwards" to find primary parent
        const parentIds = f.ParentDataFileID.split(/[,;]/).map((s) => s.trim());
        const parentFiles = parentIds.reduce(
            (aggr: BaseSerializableEntity[], id: string) => {
                const file = filesByFileId[id];
                if (file) {
                    aggr.push(file);
                } else {
                    // @ts-ignore
                    //(win as any).missing.push(id);
                }
                return aggr;
            },
            []
        );

        primaryParents = _(parentFiles)
            .map((f) => findAndAddPrimaryParents(f, filesByFileId))
            .flatten()
            .uniq()
            .value();

        // add primaryParents member to child file
        (f as SerializableEntity).primaryParents = primaryParents;
    } else {
        // recursive base case: parent (has no parent itself)
        primaryParents = [f.DataFileID];

        // we don't add primaryParents member to the parent file
    }

    return primaryParents;
}

function extractBiospecimensAndDiagnosisAndDemographicsAndTherapy(
    data: BaseSerializableEntity[]
) {
    const biospecimenByBiospecimenID: {
        [biospecimenID: string]: BaseSerializableEntity;
    } = {};
    const diagnosisByParticipantID: {
        [participantID: string]: BaseSerializableEntity;
    } = {};
    const demographicsByParticipantID: {
        [participantID: string]: BaseSerializableEntity;
    } = {};
    const therapyByParticipantID: {
        [participantID: string]: BaseSerializableEntity;
    } = {};

    data.forEach((entity) => {
        if (entity.Component === 'Biospecimen') {
            biospecimenByBiospecimenID[entity.BiospecimenID] = entity;
        }
        if (entity.Component === 'Diagnosis') {
            diagnosisByParticipantID[entity.ParticipantID] = entity;
        }
        if (entity.Component === 'Demographics') {
            demographicsByParticipantID[entity.ParticipantID] = entity;
        }
        if (entity.Component === 'Therapy') {
            therapyByParticipantID[entity.ParticipantID] = entity;
        }
    });

    return {
        biospecimenByBiospecimenID,
        diagnosisByParticipantID,
        demographicsByParticipantID,
        therapyByParticipantID,
    };
}

function getParentBiospecimenIDs(file: BaseSerializableEntity) {
    return file?.ParentBiospecimenID?.split(/[,;]/).map((s) => s.trim()) || [];
}

function getParentBiospecimens(
    file: BaseSerializableEntity,
    biospecimenByBiospecimenID: {
        [biospecimenID: string]: BaseSerializableEntity;
    }
) {
    return getParentBiospecimenIDs(file).map(
        (ParentBiospecimenID) =>
            biospecimenByBiospecimenID[ParentBiospecimenID] as
                | Entity
                | undefined
    );
}

function getSampleAndPatientData(
    file: BaseSerializableEntity,
    filesByHTANId: { [DataFileID: string]: BaseSerializableEntity },
    biospecimenByBiospecimenID: {
        [biospecimenID: string]: BaseSerializableEntity;
    },
    diagnosisByParticipantID: {
        [participantID: string]: BaseSerializableEntity;
    },
    demographicsByParticipantID: {
        [participantID: string]: BaseSerializableEntity;
    },
    therapyByParticipantID: {
        [participantID: string]: BaseSerializableEntity;
    }
) {
    const primaryParents =
        file.primaryParents && file.primaryParents.length
            ? file.primaryParents
            : [file.DataFileID];

    for (let p of primaryParents) {
        if (
            getParentBiospecimens(filesByHTANId[p], biospecimenByBiospecimenID)
                .length === 0
        ) {
            console.log(
                'Missing ParentBiospecimenID: ',
                _.pickBy(filesByHTANId[p], _.identity)
            );
            return undefined;
        }
    }

    const biospecimen = _(primaryParents)
        .map((p) =>
            getParentBiospecimens(filesByHTANId[p], biospecimenByBiospecimenID)
        )
        .flatten()
        .compact()
        .uniqBy((b) => b.BiospecimenID)
        .value();

    const diagnosis = _.uniqBy(
        getCaseData(
            biospecimen,
            biospecimenByBiospecimenID,
            diagnosisByParticipantID
        ),
        (d) => d.ParticipantID
    );

    const demographics = _.uniqBy(
        getCaseData(
            biospecimen,
            biospecimenByBiospecimenID,
            demographicsByParticipantID
        ),
        (d) => d.ParticipantID
    );

    const therapy = _.uniqBy(
        getCaseData(
            biospecimen,
            biospecimenByBiospecimenID,
            therapyByParticipantID
        ),
        (d) => d.ParticipantID
    );

    return { biospecimen, diagnosis, demographics, therapy };
}

function getCaseData(
    biospecimen: BaseSerializableEntity[],
    biospecimenByBiospecimenID: {
        [biospecimenID: string]: BaseSerializableEntity;
    },
    casesByParticipantID: {
        [participantID: string]: BaseSerializableEntity;
    }
) {
    return biospecimen
        .map((s) => {
            // parentID can be both participant or biospecimen, so keep
            // going up the tree until participant is found.
            let parentID = s.ParentID;
            const alreadyProcessed = new Set();

            while (parentID in biospecimenByBiospecimenID) {
                // this is to prevent infinite loop due to possible circular references
                if (alreadyProcessed.has(parentID)) {
                    break;
                } else {
                    alreadyProcessed.add(parentID);
                }

                const parentBioSpecimen = biospecimenByBiospecimenID[parentID];
                if (parentBioSpecimen.ParentID) {
                    parentID = parentBioSpecimen.ParentID;
                }
            }

            if (!(parentID in casesByParticipantID)) {
                // console.error(
                //     `${s.BiospecimenID} does not have a parentID (${parentID}) with diagnosis/demographics information`
                // );
                return undefined;
            } else {
                return casesByParticipantID[parentID] as Entity;
            }
        })
        .filter((f) => !!f) as BaseSerializableEntity[];
}

function extractEntitiesFromSynapseData(
    data: SynapseData,
    schemaDataById: SchemaDataById,
    AtlasMetaMap: { [uppercase_htan_id: string]: AtlasMeta },
    imagingLevel1ById: { [fileId: string]: ImagingMetadata },
    imagingLevel2ById: { [fileId: string]: ImagingMetadata }
): BaseSerializableEntity[] {
    const entities: BaseSerializableEntity[] = [];

    _.forEach(data.atlases, (atlas: SynapseAtlas) => {
        _.forEach(atlas, (synapseRecords, key) => {
            if (key === 'htan_id' || key === 'htan_name') {
                // skip these
                return;
            }
            const schemaId = synapseRecords.data_schema;

            if (schemaId) {
                const schema = schemaDataById[schemaId];
                const attributeToId = getAttributeToSchemaIdMap(
                    schema,
                    schemaDataById
                );
                // synapseId and Uuid is a custom column that doesn't exist in the schema, so add it manually
                attributeToId['entityId'] = 'bts:synapseId';
                attributeToId['Uuid'] = 'bts:uuid';
                // this is a workaround for missing HTANParentBiospecimenID for certain schema ids
                if (
                    synapseRecords.column_order.includes(
                        'HTAN Parent Biospecimen ID'
                    ) &&
                    !attributeToId['HTAN Parent Biospecimen ID']
                ) {
                    attributeToId['HTAN Parent Biospecimen ID'] =
                        'bts:HTANParentBiospecimenID';
                }
                // this is a workaround for missing AssayType for certain schema ids
                if (synapseRecords.column_order.includes('Assay Type')) {
                    attributeToId['Assay Type'] = 'bts:AssayType';
                }
                // this is a workaround for missing DatasetName for certain schema ids
                if (synapseRecords.column_order.includes('Dataset Name')) {
                    attributeToId['Dataset Name'] = 'bts:DatasetName';
                }

                synapseRecords.record_list.forEach((record) => {
                    const entity: Partial<BaseSerializableEntity> = {};

                    synapseRecords.column_order.forEach((column, i) => {
                        const id = attributeToId[column];

                        if (id) {
                            entity[
                                id.replace(
                                    /^bts:/,
                                    ''
                                ) as keyof BaseSerializableEntity
                            ] = record.values[i];
                        }
                    });

                    // schema.attributes.forEach(
                    //     (f: SynapseSchema['attributes'][0], i: number) => {
                    //         entity[
                    //             f.id.replace(
                    //                 /^bts:/,
                    //                 ''
                    //             ) as keyof BaseSerializableEntity
                    //         ] = record.values[i];
                    //     }
                    // );

                    entity.atlasid = atlas.htan_id;
                    entity.atlas_name = atlas.htan_name;
                    if (entity.Component) {
                        const parsedAssay = parseRawAssayType(
                            entity.Component,
                            entity.ImagingAssayType,
                            entity.AssayType,
                            (entity as any).DataType,
                            extractParentImagingAssayTypes(
                                entity.ParentDataFileID ||
                                    (entity as any)[
                                        HTANAttributeNames.HTANParentDataFileID
                                    ],
                                imagingLevel1ById,
                                imagingLevel2ById
                            )
                        );
                        //file.Component = parsed.name;
                        if (parsedAssay.level && parsedAssay.level.length > 1) {
                            entity.level = parsedAssay.level;
                        } else {
                            entity.level = 'Unknown';
                        }
                        entity.assayName = parsedAssay.name;

                        // special case for Other Assay.  These are assays that don't fit
                        // the standard model.  To have a more descriptive name use assay
                        // type field instead
                        if (parsedAssay.name === 'Other Assay') {
                            entity.assayName =
                                entity.AssayType || 'Other Assay';
                            entity.level = 'Other';
                        } else if (
                            parsedAssay.name.toLowerCase().includes('auxiliary')
                        ) {
                            // For 10X Visium there is Auxiliary data which
                            // doesn't fit any levels either, so we're simply
                            // calling it Auxiliary
                            entity.level = 'Auxiliary';
                        }
                    } else {
                        entity.level = 'Unknown';
                    }

                    entity.AtlasMeta =
                        AtlasMetaMap[
                            entity.atlasid.split('_')[0].toUpperCase()
                        ];

                    entities.push(entity as BaseSerializableEntity);
                });
            }
        });
    });

    return entities;
}

function extractParentImagingAssayTypes(
    parentDataFileId?: string,
    imagingLevel1ById?: { [fileId: string]: ImagingMetadata },
    imagingLevel2ById?: { [fileId: string]: ImagingMetadata }
) {
    if (!parentDataFileId) {
        return undefined;
    }

    const parentIds = parentDataFileId.split(/[,;]/).map((s) => s.trim());
    const level1ParentAssayTypes = parentIds.map(
        (id) => imagingLevel1ById?.[id]?.Imaging_Assay_Type
    );
    const level2ParentAssayTypes = parentIds.map(
        (id) => imagingLevel2ById?.[id]?.Imaging_Assay_Type
    );

    return _([...level2ParentAssayTypes, ...level1ParentAssayTypes])
        .uniq()
        .compact()
        .value();
}

function parseRawAssayType(
    componentName: string,
    imagingAssayType?: string,
    assayType?: string,
    dataType?: string,
    parentAssayTypes?: string[]
) {
    // It comes in the form bts:CamelCase-NameLevelX (may or may not have that hyphen).
    // We want to take that and spit out { name: "Camel Case-Name", level: "Level X" }
    //  (with the exception that the prefixes Sc and Sn are always treated as lower case)

    // See if there's a Level in it
    const splitByLevel = componentName.split('Level');
    const level = splitByLevel.length > 1 ? `Level ${splitByLevel[1]}` : null;
    const extractedName = splitByLevel[0];

    const type = imagingAssayType || assayType || dataType;

    if (type) {
        // do not parse imaging assay type or assay type or data type,
        // use as is
        return { name: type, level };
    }

    if (parentAssayTypes?.length) {
        // TODO console.log warning if parentAssayTypes.length > 1
        return { name: parentAssayTypes[0], level };
    }

    if (extractedName) {
        // Convert camel case to space case
        // Source: https://stackoverflow.com/a/15370765
        let name = extractedName.replace(
            /([A-Z])([A-Z])([a-z])|([a-z])([A-Z])/g,
            '$1$4 $2$3$5'
        );

        // special case: sc as prefix
        name = name.replace(/\bSc /g, 'sc');

        // special case: sn as prefix
        name = name.replace(/\bSn /g, 'sn');

        return { name, level };
    }

    // Couldn't parse
    return { name: componentName, level: null };
}

writeProcessedFile();
