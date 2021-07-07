import _ from 'lodash';
import { NextRouter } from 'next/router';
import fetch from 'node-fetch';
import * as Path from 'path';
import { toArabic } from 'roman-numerals';

import { WPAtlas } from '../types';
import {
    ExploreOptionType,
    ExploreSelectedFilter,
    SynapseAtlas,
    SynapseData,
    SynapseSchema,
} from './types';
import { ExploreURLQuery } from '../pages/explore';
import { ExploreTab } from '../components/ExploreTabs';
import getData from './getData';

// @ts-ignore
let win;

if (typeof window !== 'undefined') {
    win = window as any;
} else {
    win = {} as any;
}

export function extractEntitiesFromSynapseData(
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

export type HTANDataFileID = string;
export type HTANBiospecimenID = string;
export type HTANParticipantID = string;

export interface BaseSerializableEntity {
    // Synapse attribute names
    AJCCPathologicStage: string;
    Biospecimen: string;
    Component: string;
    HTANParentID: string;
    HTANBiospecimenID: string;
    HTANDataFileID: HTANDataFileID; // this is used as the stable UID
    HTANParentBiospecimenID: string;
    HTANParentDataFileID: string;
    TissueorOrganofOrigin: string;
    PrimaryDiagnosis: string;
    AgeatDiagnosis: number;
    fileFormat: string;
    filename: string;
    HTANParticipantID: string;
    ImagingAssayType?: string;
    AssayType?: string;

    // Derived or attached in frontend
    atlasid: string;
    atlas_name: string;
    level: string;
    assayName?: string;
    WPAtlas: WPAtlas;
    primaryParents?: HTANDataFileID[];
    synapseId?: string;
}

export interface SerializableEntity extends BaseSerializableEntity {
    biospecimenIds: HTANBiospecimenID[];
    diagnosisIds: HTANParticipantID[];
    demographicsIds: HTANParticipantID[];
}

// Entity links in some referenced objects, which will help
//  for search/filter efficiency, and adds `cases` member.
export interface Entity extends SerializableEntity {
    biospecimen: Entity[];
    diagnosis: Entity[];
    demographics: Entity[];
    cases: Entity[];
}

export type Atlas = {
    htan_id: string;
    htan_name: string;
    num_cases: number;
    num_biospecimens: number;
    WPAtlas: WPAtlas;
};

export interface LoadDataResult {
    files: SerializableEntity[];
    atlases: Atlas[];
    biospecimenByHTANBiospecimenID: {
        [HTANBiospecimenID: string]: SerializableEntity;
    };
    diagnosisByHTANParticipantID: {
        [HTANParticipantID: string]: SerializableEntity;
    };
    demographicsByHTANParticipantID: {
        [HTANParticipantID: string]: SerializableEntity;
    };
}

win.missing = [];

function doesFileHaveMultipleParents(file: Entity) {
    return /Level[456]/.test(file.Component);
}

export function doesFileIncludeLevel1OrLevel2SequencingData(file: Entity) {
    return (
        !file.Component.startsWith('Imaging') &&
        (file.level === 'Level 1' || file.level === 'Level 2')
    );
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
                    (win as any).missing.push(id);
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

function addPrimaryParents(files: BaseSerializableEntity[]) {
    const fileIdToFile = _.keyBy(files, (f) => f.HTANDataFileID);

    files.forEach((f) => {
        findAndAddPrimaryParents(f, fileIdToFile);
    });
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

function mergeCaseData(
    diagnosis: Entity[],
    demographicsByHTANParticipantID: { [htanParticipantID: string]: Entity }
) {
    return diagnosis.map((d) => ({
        ...d,
        ...demographicsByHTANParticipantID[d.HTANParticipantID],
    }));
}

export async function loadData(
    WPAtlasData: WPAtlas[]
): Promise<LoadDataResult> {
    //const url = `https://data.humantumoratlas.org/syn_data.json`; // '/sim.json';

    //const data: SynapseData = await fetch(url).then((r) => r.json());

    const data = getData();

    return processSynapseJSON(data, WPAtlasData);
}

export function fillInEntities(data: LoadDataResult): Entity[] {
    const biospecimenMap = data.biospecimenByHTANBiospecimenID;
    const diagnosisMap = data.diagnosisByHTANParticipantID;
    const demoMap = data.demographicsByHTANParticipantID;

    data.files.forEach((file) => {
        (file as Entity).biospecimen = file.biospecimenIds.map(
            (id) => biospecimenMap[id] as Entity
        );
        (file as Entity).diagnosis = file.diagnosisIds.map(
            (id) => diagnosisMap[id] as Entity
        );
        (file as Entity).demographics = file.demographicsIds.map(
            (id) => demoMap[id] as Entity
        );
        (file as Entity).cases = _.uniqBy(
            mergeCaseData(
                (file as Entity).diagnosis,
                demoMap as { [id: string]: Entity }
            ),
            (c) => c.HTANParticipantID
        );
    });

    return data.files as Entity[];
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

export function processSynapseJSON(
    synapseJson: SynapseData,
    WPAtlasData: WPAtlas[]
) {
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

            return file as SerializableEntity;
        })
        .filter((f) => f.diagnosisIds.length > 0); // files must have a diagnosis

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

export function sortStageOptions(options: ExploreOptionType[]) {
    const sortedOptions = _.sortBy(options, (option) => {
        const numeral = option.value.match(/stage ([IVXLCDM]+)/i);
        let val = undefined;
        if (!!numeral && numeral.length > 1) {
            try {
                const number = toArabic(numeral[1]);
            } catch (ex) {
                val = numeral[1];
            }
        }
        return option.label;
    });

    const withStage = sortedOptions.filter((option) =>
        /stage/i.test(option.label)
    );
    const withoutStage = sortedOptions.filter(
        (option) => !/stage/i.test(option.label)
    );

    return withStage.concat(withoutStage);

    //return options;
}

export function clamp(x: number, lower: number, upper: number) {
    return Math.max(lower, Math.min(x, upper));
}

export function parseRawAssayType(
    componentName: string,
    imagingAssayType?: string
) {
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

export function urlEncodeSelectedFilters(
    selectedFilters: ExploreSelectedFilter[]
) {
    return JSON.stringify(selectedFilters);
}
export function parseSelectedFiltersFromUrl(
    selectedFiltersURLQueryParam: string | undefined
): ExploreSelectedFilter[] | null {
    if (selectedFiltersURLQueryParam) {
        return JSON.parse(selectedFiltersURLQueryParam);
    }
    return null;
}

function addQueryStringToURL(
    url: string,
    queryParams: { [key: string]: string | undefined }
) {
    const urlEncoded = _.map(queryParams, (val, key) => {
        if (val) {
            return `${key}=${val}`;
        } else {
            return '';
        }
    }).filter((x) => !!x); // take out empty params

    if (urlEncoded.length > 0) {
        return `${url}?${urlEncoded.join('&')}`;
    } else {
        return url;
    }
}

export function getExplorePageURL(
    tab: ExploreTab,
    filters: ExploreSelectedFilter[]
) {
    let url = '/explore';
    if (filters.length > 0) {
        const query: ExploreURLQuery = {
            selectedFilters: urlEncodeSelectedFilters(filters),
            tab,
        }; // using this intermediate container to use typescript to enforce URL correctness
        url = addQueryStringToURL(url, query);
    }
    return url;
}

export function getAtlasPageURL(id: string) {
    return `/atlas/${id}`;
}

export function updateSelectedFiltersInURL(
    filters: ExploreSelectedFilter[],
    router: NextRouter
) {
    router.push(
        {
            pathname: router.pathname,
            query: Object.assign({}, router.query, {
                selectedFilters: urlEncodeSelectedFilters(filters),
            }),
        },
        undefined,
        { shallow: true }
    );
}

export function setTab(tab: string, router: NextRouter) {
    router.push(
        {
            pathname: router.pathname,
            query: Object.assign({}, router.query, { tab }),
        },
        undefined,
        { shallow: true }
    );
}

export type EntityReport = {
    description: string;
    text: string;
};

export function computeDashboardData(files: Entity[]): EntityReport[] {
    const uniqueAtlases = new Set();
    const uniqueOrgans = new Set();
    const uniqueBiospecs = new Set();
    const uniqueCases = new Set();
    for (const file of files) {
        if (file.atlasid) {
            uniqueAtlases.add(file.atlasid);
        }
        for (const biospec of file.biospecimen) {
            uniqueBiospecs.add(biospec.HTANBiospecimenID);
        }
        for (const diag of file.diagnosis) {
            uniqueCases.add(diag.HTANParticipantID);
            uniqueOrgans.add(diag.TissueorOrganofOrigin);
        }
    }
    return [
        { description: 'Atlases', text: uniqueAtlases.size.toString() },
        { description: 'Organs', text: uniqueOrgans.size.toString() },
        { description: 'Cases', text: uniqueCases.size.toString() },
        { description: 'Biospecimens', text: uniqueBiospecs.size.toString() },
    ];
}

export function getFileBase(filename: string) {
    return Path.basename(filename);
}

export function getFileExtension(filename: string) {
    return Path.extname(filename);
}

export function getFilenameWithoutExtension(base: string) {
    return base.includes('.') ? base.slice(0, base.lastIndexOf('.')) : base;
}

export function truncateFilename(
    filename: string,
    leadThreshold: number = 10,
    trailThreshold: number = 5
) {
    const base = getFileBase(filename);
    const ext = getFileExtension(filename);
    const name = getFilenameWithoutExtension(base);

    let displayValue = base;

    if (name.length > leadThreshold + trailThreshold) {
        // get the first <leadThreshold> characters of the name
        const lead = name.slice(0, leadThreshold);
        // get the last <trailThreshold> characters of the name
        const trail = name.slice(-trailThreshold);
        // always keep the extension (everything after the last dot)
        displayValue = `${lead}...${trail}${ext}`;
    }

    return displayValue;
}

export function convertAgeInDaysToYears(ageInDays: number) {
    return Math.round(ageInDays / 365);
}
