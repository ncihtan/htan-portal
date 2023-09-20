import { SynapseAtlas, SynapseData } from '../lib/types';
import _ from 'lodash';

import {
    Atlas,
    isLowestLevel,
    LoadDataResult,
    ReleaseEntity,
} from '../lib/helpers';
import getData from '../lib/getData';
import {
    fetchAndProcessSchemaData,
    getAttributeToSchemaIdMap,
    SchemaDataById,
} from '../lib/dataSchemaHelpers';
import fs from 'fs';
import csvToJson from 'csvtojson';
import atlasJson from './atlases.json';
import {
    AtlasMeta,
    BaseSerializableEntity,
    DataFileID,
    DownloadSourceCategory,
    Entity,
    SerializableEntity,
} from '../packages/data-portal-commons/src/libs/entity';
import {
    HTANAttributeNames,
    HTANToGenericAttributeMap,
} from '../packages/data-portal-commons/src/libs/types';

// import idcAssets from './idc-imaging-assets.json';
// const idcIds = _.keyBy(idcAssets, 'ContainerIdentifier');

async function writeProcessedFile() {
    const synapseJson = getData();
    const schemaData = await fetchAndProcessSchemaData();
    const entitiesById = await getEntitiesById();

    const activeAtlases = atlasJson; //atlasJson.filter((a) => a.htan_id === 'hta7');

    /* @ts-ignore */
    const processed: LoadDataResult = processSynapseJSON(
        synapseJson,
        schemaData,
        activeAtlases as AtlasMeta[],
        entitiesById
    );
    fs.writeFileSync(
        'public/processed_syn_data.json',
        JSON.stringify(processed)
    );
}

async function getEntitiesById() {
    const rows = await csvToJson().fromFile('data/entities_v4.csv');
    return _.keyBy(rows, (row) => row.entityId);
}

function addReleaseInfo(
    file: BaseSerializableEntity,
    entitiesById: { [entityId: string]: ReleaseEntity }
) {
    if (file.synapseId && entitiesById[file.synapseId]) {
        file.releaseVersion = entitiesById[file.synapseId].Data_Release;
    }
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
        file.assayName &&
        (file.assayName.toLowerCase().includes('bulk') ||
            file.assayName.toLowerCase().includes('seq')) &&
        (file.level === 'Level 1' || file.level === 'Level 2')
    ) {
        file.isRawSequencing = true;
        if (file.synapseId && dbgapSynapseSet.has(file.synapseId)) {
            file.downloadSource = DownloadSourceCategory.dbgap;
        } else {
            file.downloadSource = DownloadSourceCategory.comingSoon;
        }
    } else {
        file.isRawSequencing = false;

        if (
            file.level === 'Level 3' ||
            file.level === 'Level 4' ||
            file.level === 'Auxiliary' ||
            file.level === 'Other'
        ) {
            file.downloadSource = DownloadSourceCategory.synapse;
        } else if (file.synapseId && dbgapImgSynapseSet.has(file.synapseId)) {
            // Level 2 imaging data is open access
            if (
                file.level === 'Level 2' &&
                file.Component.startsWith('Imaging')
            ) {
                file.downloadSource = DownloadSourceCategory.cds;
            } else {
                file.downloadSource = DownloadSourceCategory.dbgap;
            }
        } else if (file.Component === 'OtherAssay') {
            if (file.AssayType?.toLowerCase() === '10x visium') {
                // 10X Visium raw data will go to dbGap, but isn't available yet
                file.downloadSource = DownloadSourceCategory.dbgap;
            } else {
                file.downloadSource = DownloadSourceCategory.synapse;
            }
        } else {
            file.downloadSource = DownloadSourceCategory.comingSoon;
        }
    }
}

function processSynapseJSON(
    synapseJson: SynapseData,
    schemaData: SchemaDataById,
    AtlasMetaData: AtlasMeta[],
    entitiesById: { [entityId: string]: ReleaseEntity }
) {
    const AtlasMetaMap = _.keyBy(AtlasMetaData, (a) => a.htan_id.toUpperCase());
    let flatData = extractEntitiesFromSynapseData(
        synapseJson,
        schemaData,
        AtlasMetaMap
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

    addPrimaryParents(files);

    const {
        biospecimenByBiospecimenID,
        diagnosisByParticipantID,
        demographicsByParticipantID,
    } = extractBiospecimensAndDiagnosisAndDemographics(flatData);

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
            demographicsByParticipantID
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

        addDownloadSourcesInfo(file, dbgapSynapseSet, dbgapImgSynapseSet);
        addReleaseInfo(file, entitiesById);
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
            .flatMapDeep((f) => f.diagnosisIds)
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

    // unify all 10x Visium assays under the same assay name
    _.forEach(returnFiles, (file) => {
        if (file.assayName?.toLowerCase().startsWith('10x visium')) {
            file.assayName = '10x Visium';
        }
    });

    // filter out files without a diagnosis
    const ret = {
        files: returnFiles,
        atlases: returnAtlases,
        biospecimenByBiospecimenID: biospecimenByBiospecimenID as {
            [BiospecimenID: string]: SerializableEntity;
        },
        diagnosisByParticipantID: diagnosisByParticipantID as {
            [ParticipantID: string]: SerializableEntity;
        },
        demographicsByParticipantID: demographicsByParticipantID as {
            [ParticipantID: string]: SerializableEntity;
        },
    };

    // TODO clean up
    console.log(ret.files.length);
    console.log(_.size(ret.demographicsByParticipantID));

    return ret;
}

function addPrimaryParents(files: BaseSerializableEntity[]) {
    const fileIdToFile = _.keyBy(files, (f) => f.DataFileID);

    files.forEach((f) => {
        findAndAddPrimaryParents(f, fileIdToFile);
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

function extractBiospecimensAndDiagnosisAndDemographics(
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
    });

    return {
        biospecimenByBiospecimenID,
        diagnosisByParticipantID,
        demographicsByParticipantID,
    };
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
    }
) {
    const primaryParents =
        file.primaryParents && file.primaryParents.length
            ? file.primaryParents
            : [file.DataFileID];

    for (let p of primaryParents) {
        const parentBiospecimenID = filesByHTANId[p].ParentBiospecimenID;
        if (
            !parentBiospecimenID ||
            !biospecimenByBiospecimenID[parentBiospecimenID]
        ) {
            console.log('Missing ParentBiospecimenID: ', filesByHTANId[p]);
            return undefined;
        }
    }

    let biospecimen = primaryParents
        .map((p) =>
            filesByHTANId[p].ParentBiospecimenID.split(/[,;]/)
                .map((s) => s.trim())
                .map(
                    (ParentBiospecimenID) =>
                        biospecimenByBiospecimenID[ParentBiospecimenID] as
                            | Entity
                            | undefined
                )
        )
        .flat()
        .filter((f) => !!f) as BaseSerializableEntity[];
    biospecimen = _.uniqBy(biospecimen, (b) => b.BiospecimenID);

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

    return { biospecimen, diagnosis, demographics };
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
            // ParentID can be both participant or biospecimen, so keep
            // going up the tree until participant is found.
            let ParentID = s.ParentID;

            while (ParentID in biospecimenByBiospecimenID) {
                const parentBioSpecimen = biospecimenByBiospecimenID[ParentID];
                if (parentBioSpecimen.ParentID) {
                    ParentID = parentBioSpecimen.ParentID;
                } else {
                    break;
                }
            }

            if (!(ParentID in casesByParticipantID)) {
                // console.error(
                //     `${s.BiospecimenID} does not have a ParentID (${ParentID}) with diagnosis/demographics information`
                // );
                return undefined;
            } else {
                return casesByParticipantID[ParentID] as Entity;
            }
        })
        .filter((f) => !!f) as BaseSerializableEntity[];
}

function extractEntitiesFromSynapseData(
    data: SynapseData,
    schemaDataById: SchemaDataById,
    AtlasMetaMap: { [uppercase_htan_id: string]: AtlasMeta }
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
                            entity.ImagingAssayType
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

function parseRawAssayType(componentName: string, imagingAssayType?: string) {
    // It comes in the form bts:CamelCase-NameLevelX (may or may not have that hyphen).
    // We want to take that and spit out { name: "Camel Case-Name", level: "Level X" }
    //  (with the exception that the prefixes Sc and Sn are always treated as lower case)

    // See if there's a Level in it
    const splitByLevel = componentName.split('Level');
    const level = splitByLevel.length > 1 ? `Level ${splitByLevel[1]}` : null;
    const extractedName = splitByLevel[0];

    if (imagingAssayType) {
        // do not parse imaging assay type, use as is
        return { name: imagingAssayType, level };
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
