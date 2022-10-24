import {
    DownloadSourceCategory,
    SynapseAtlas,
    SynapseData,
    SynapseSchema,
} from '../lib/types';
import { WPAtlas } from '../types';
import _ from 'lodash';
import {
    Atlas,
    BaseSerializableEntity,
    Entity,
    HTANDataFileID,
    LoadDataResult,
    SerializableEntity,
} from '../lib/helpers';
import getData from '../lib/getData';
import fs from 'fs';
import { getAtlasList } from '../ApiUtil';
import dgbapIds from './dbgap_release_all.json';
import idcIds from './idc-imaging-assets.json';

async function writeProcessedFile() {
    const data = getData();
    const atlases = await getAtlasList();
    const processed: LoadDataResult = processSynapseJSON(data, atlases);
    fs.writeFileSync(
        'public/processed_syn_data.json',
        JSON.stringify(processed)
    );
}

function addDownloadSourcesInfo(file: BaseSerializableEntity) {
    const dbgapSynapseSet = new Set(dgbapIds);

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

        if (file.level === 'Level 3' || file.level === 'Level 4') {
            file.downloadSource = DownloadSourceCategory.synapse;
        } else if (file.HTANDataFileID in idcIds) {
            file.downloadSource = DownloadSourceCategory.idc;
        } else if (file.Component === 'OtherAssay') {
            if (file.AssayType === '10X Visium') {
                // 10X Visium raw data will go to dbGap, but isn't available yet
                file.downloadSource = DownloadSourceCategory.comingSoon;
            } else {
                file.downloadSource = DownloadSourceCategory.synapse;
            }
        } else {
            file.downloadSource = DownloadSourceCategory.comingSoon;
        }
    }
}

function processSynapseJSON(synapseJson: SynapseData, WPAtlasData: WPAtlas[]) {
    const WPAtlasMap = _.keyBy(WPAtlasData, (a) => a.htan_id.toUpperCase());
    const flatData = extractEntitiesFromSynapseData(synapseJson, WPAtlasMap);

    const files = flatData.filter((obj) => {
        return !!obj.filename;
    });

    const filesByHTANId = _.keyBy(files, (f) => f.HTANDataFileID);

    addPrimaryParents(files);
    const {
        biospecimenByHTANBiospecimenID,
        diagnosisByHTANParticipantID,
        demographicsByHTANParticipantID,
    } = extractBiospecimensAndDiagnosisAndDemographics(flatData);

    const returnFiles = files
        .map((file) => {
            const parentData = getSampleAndPatientData(
                file,
                filesByHTANId,
                biospecimenByHTANBiospecimenID,
                diagnosisByHTANParticipantID,
                demographicsByHTANParticipantID
            );

            (file as SerializableEntity).biospecimenIds = parentData.biospecimen.map(
                (b) => b.HTANBiospecimenID
            );
            (file as SerializableEntity).diagnosisIds = parentData.diagnosis.map(
                (d) => d.HTANParticipantID
            );
            (file as SerializableEntity).demographicsIds = parentData.demographics.map(
                (d) => d.HTANParticipantID
            );

            addDownloadSourcesInfo(file);
            return file as SerializableEntity;
        })
        .filter((f) => f.diagnosisIds.length > 0) // files must have a diagnosis
        .filter(
            (f) =>
                f.downloadSource !== DownloadSourceCategory.comingSoon ||
                f.ImagingAssayType
        ); // remove files that can't be downloaded unless it's imaging

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
        const WPAtlas = WPAtlasMap[atlas.htan_id.toUpperCase()];

        // atlases MUST have an entry in WPAtlas
        if (WPAtlas) {
            returnAtlases.push({
                htan_id: atlas.htan_id,
                htan_name: atlas.htan_name,
                WPAtlas,
                num_biospecimens: biospecimenCountByAtlas[atlas.htan_id],
                num_cases: caseCountByAtlas[atlas.htan_id],
            });
        }
    }

    // filter out files without a diagnosis
    return {
        files: returnFiles,
        atlases: returnAtlases,
        biospecimenByHTANBiospecimenID: biospecimenByHTANBiospecimenID as {
            [HTANBiospecimenID: string]: SerializableEntity;
        },
        diagnosisByHTANParticipantID: diagnosisByHTANParticipantID as {
            [HTANParticipantID: string]: SerializableEntity;
        },
        demographicsByHTANParticipantID: demographicsByHTANParticipantID as {
            [HTANParticipantID: string]: SerializableEntity;
        },
    };
}

function addPrimaryParents(files: BaseSerializableEntity[]) {
    const fileIdToFile = _.keyBy(files, (f) => f.HTANDataFileID);

    files.forEach((f) => {
        findAndAddPrimaryParents(f, fileIdToFile);
    });
}

function findAndAddPrimaryParents(
    f: BaseSerializableEntity,
    filesByFileId: { [HTANDataFileID: string]: BaseSerializableEntity }
): HTANDataFileID[] {
    if (f.primaryParents) {
        // recursive optimization:
        //  if we've already calculated f.primaryParents, just return it
        return f.primaryParents;
    }

    // otherwise, compute parents
    let primaryParents: HTANDataFileID[] = [];

    if (f.HTANParentDataFileID) {
        // if there's a parent, traverse "upwards" to find primary parent
        const parentIds = f.HTANParentDataFileID.split(/[,;]/);
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
        primaryParents = [f.HTANDataFileID];

        // we don't add primaryParents member to the parent file
    }

    return primaryParents;
}

function extractBiospecimensAndDiagnosisAndDemographics(
    data: BaseSerializableEntity[]
) {
    const biospecimenByHTANBiospecimenID: {
        [htanBiospecimenID: string]: BaseSerializableEntity;
    } = {};
    const diagnosisByHTANParticipantID: {
        [htanParticipantID: string]: BaseSerializableEntity;
    } = {};
    const demographicsByHTANParticipantID: {
        [htanParticipantID: string]: BaseSerializableEntity;
    } = {};

    data.forEach((entity) => {
        if (entity.Component === 'Biospecimen') {
            biospecimenByHTANBiospecimenID[entity.HTANBiospecimenID] = entity;
        }
        if (entity.Component === 'Diagnosis') {
            diagnosisByHTANParticipantID[entity.HTANParticipantID] = entity;
        }
        if (entity.Component === 'Demographics') {
            demographicsByHTANParticipantID[entity.HTANParticipantID] = entity;
        }
    });

    return {
        biospecimenByHTANBiospecimenID,
        diagnosisByHTANParticipantID,
        demographicsByHTANParticipantID,
    };
}

function getSampleAndPatientData(
    file: BaseSerializableEntity,
    filesByHTANId: { [HTANDataFileID: string]: BaseSerializableEntity },
    biospecimenByHTANBiospecimenID: {
        [htanBiospecimenID: string]: BaseSerializableEntity;
    },
    diagnosisByHTANParticipantID: {
        [htanParticipantID: string]: BaseSerializableEntity;
    },
    demographicsByHTANParticipantID: {
        [htanParticipantID: string]: BaseSerializableEntity;
    }
) {
    const primaryParents =
        file.primaryParents && file.primaryParents.length
            ? file.primaryParents
            : [file.HTANDataFileID];

    for (let p of primaryParents) {
        const HTANParentBiospecimenID =
            filesByHTANId[p].HTANParentBiospecimenID;
        if (
            !HTANParentBiospecimenID ||
            !biospecimenByHTANBiospecimenID[HTANParentBiospecimenID]
        ) {
            console.error(
                'Missing HTANParentBiospecimenID: ',
                filesByHTANId[p]
            );
        }
    }

    let biospecimen = primaryParents
        .map((p) =>
            filesByHTANId[p].HTANParentBiospecimenID.split(',').map(
                (HTANParentBiospecimenID) =>
                    biospecimenByHTANBiospecimenID[HTANParentBiospecimenID] as
                        | Entity
                        | undefined
            )
        )
        .flat()
        .filter((f) => !!f) as BaseSerializableEntity[];
    biospecimen = _.uniqBy(biospecimen, (b) => b.HTANBiospecimenID);

    const diagnosis = _.uniqBy(
        getCaseData(
            biospecimen,
            biospecimenByHTANBiospecimenID,
            diagnosisByHTANParticipantID
        ),
        (d) => d.HTANParticipantID
    );

    const demographics = _.uniqBy(
        getCaseData(
            biospecimen,
            biospecimenByHTANBiospecimenID,
            demographicsByHTANParticipantID
        ),
        (d) => d.HTANParticipantID
    );

    return { biospecimen, diagnosis, demographics };
}

function getCaseData(
    biospecimen: BaseSerializableEntity[],
    biospecimenByHTANBiospecimenID: {
        [htanBiospecimenID: string]: BaseSerializableEntity;
    },
    casesByHTANParticipantID: {
        [htanParticipantID: string]: BaseSerializableEntity;
    }
) {
    return biospecimen
        .map((s) => {
            // HTANParentID can be both participant or biospecimen, so keep
            // going up the tree until participant is found.
            let HTANParentID = s.HTANParentID;
            while (HTANParentID in biospecimenByHTANBiospecimenID) {
                const parentBioSpecimen =
                    biospecimenByHTANBiospecimenID[HTANParentID];
                HTANParentID = parentBioSpecimen.HTANParentID;
            }
            if (!(HTANParentID in casesByHTANParticipantID)) {
                console.error(
                    `${s.HTANBiospecimenID} does not have a HTANParentID with diagnosis information`
                );
                return undefined;
            } else {
                return casesByHTANParticipantID[HTANParentID] as Entity;
            }
        })
        .filter((f) => !!f) as BaseSerializableEntity[];
}

function extractEntitiesFromSynapseData(
    data: SynapseData,
    WPAtlasMap: { [uppercase_htan_id: string]: WPAtlas }
): BaseSerializableEntity[] {
    const schemasByName = _.keyBy(data.schemas, (s) => s.data_schema);
    const entities: BaseSerializableEntity[] = [];

    _.forEach(data.atlases, (atlas: SynapseAtlas) => {
        _.forEach(atlas, (synapseRecords, key) => {
            if (key === 'htan_id' || key === 'htan_name') {
                // skip these
                return;
            }
            const schemaName = synapseRecords.data_schema;
            if (schemaName) {
                const schema = schemasByName[schemaName];

                synapseRecords.record_list.forEach((record) => {
                    const entity: Partial<BaseSerializableEntity> = {};

                    schema.attributes.forEach(
                        (f: SynapseSchema['attributes'][0], i: number) => {
                            entity[
                                f.id.replace(
                                    /^bts:/,
                                    ''
                                ) as keyof BaseSerializableEntity
                            ] = record.values[i];
                        }
                    );

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
                        }
                    } else {
                        entity.level = 'Unknown';
                    }

                    entity.WPAtlas =
                        WPAtlasMap[entity.atlasid.split('_')[0].toUpperCase()];

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
