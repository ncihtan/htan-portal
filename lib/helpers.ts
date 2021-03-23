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
} from './types';
import { ExploreURLQuery } from '../pages/explore';
import ExpandableText from '../components/ExpandableText';
import React from 'react';
import { ExploreTab } from '../components/ExploreTabs';

// @ts-ignore
let win;

if (typeof window !== 'undefined') {
    win = window as any;
} else {
    win = {} as any;
}

export function extractEntitiesFromSynapseData(data: SynapseData): Entity[] {
    const schemasByName = _.keyBy(data.schemas, (s) => s.data_schema);
    const entities: Entity[] = [];
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
                    const entity: Partial<Entity> = {};

                    schema.attributes.forEach((f: any, i: number) => {
                        entity[f.id.replace(/^bts:/, '') as keyof Entity] =
                            record.values[i];
                    });

                    entity.atlasid = atlas.htan_id;

                    entities.push(entity as Entity);
                });
            }
        });
    });

    return entities;
}

export interface Entity {
    // Synapse attribute values
    AJCCPathologicStage: string;
    Biospecimen: string;
    Component: string;
    HTANParentID: string;
    HTANBiospecimenID: any;
    HTANDataFileID: string;
    HTANParentBiospecimenID: string;
    HTANParentDataFileID: string;
    TissueorOrganofOrigin: string;
    PrimaryDiagnosis: string;
    fileFormat: string;
    filename: string;
    HTANParticipantID: string;

    // Derived or attached
    atlasid: string;
    level: string;
    WPAtlas: WPAtlas;
    biospecimen: Entity[];
    diagnosis: Entity[];
    primaryParents?: Entity[];
    synapseId?: string;
}

export interface Atlas {
    htan_id: string;
    htan_name: string;
}

export interface LoadDataResult {
    files: Entity[];
    atlases: Atlas[];
}

win.missing = [];

function findPrimaryParents(
    f: Entity,
    filesByFileId: { [HTANDataFileID: string]: Entity }
): Entity[] {
    let primaryParents: Entity[] = [];

    if (!f.HTANParentDataFileID) {
        // leave it empty
        primaryParents.push(f);
    } else {
        const parentIds = f.HTANParentDataFileID.split(/[,;]/);
        const parentFiles = parentIds.reduce((aggr: Entity[], id: string) => {
            const file = filesByFileId[id];
            if (file) {
                aggr.push(file);
            } else {
                // @ts-ignore
                (win as any).missing.push(id);
            }
            return aggr;
        }, []);

        primaryParents = _(parentFiles)
            .map((f) => findPrimaryParents(f, filesByFileId))
            .flatten()
            .uniqBy((f) => f.HTANDataFileID)
            .value();
    }

    return primaryParents;
}

function doesFileHaveMultipleParents(file: Entity) {
    return /Level[456]/.test(file.Component);
}

function addPrimaryParents(files: Entity[]) {
    const cleanFiles = files.filter((f) => {
        return !(doesFileHaveMultipleParents(f) && f.atlasid === 'HTA3'); // hard coded for now - level 4 HTA3 files have messed up data
    });

    const fileIdToFile = _.keyBy(cleanFiles, (f) => f.HTANDataFileID);

    cleanFiles.forEach((f) => {
        const primaryParents = findPrimaryParents(f, fileIdToFile);

        if (primaryParents[0] !== f) {
            f.primaryParents = primaryParents;
        }
    });
}

function getSampleAndPatientData(
    file: Entity,
    _biospecimen: Entity[],
    _diagnosis: Entity[]
) {
    const primaryParents =
        file.primaryParents && file.primaryParents.length
            ? file.primaryParents
            : [file];

    let diagnosis, biospecimen;

    biospecimen = primaryParents
        .map(
            (p) =>
                _.find(_biospecimen, {
                    HTANBiospecimenID: p.HTANParentBiospecimenID,
                }) as Entity | undefined
        )
        .filter((f) => !!f) as Entity[];

    diagnosis = biospecimen
        .map(
            (s) =>
                _.find(_diagnosis, {
                    HTANParticipantID: s.HTANParentID,
                }) as Entity | undefined
        )
        .filter((f) => !!f) as Entity[];

    return { biospecimen, diagnosis };
}

export async function loadData(
    WPAtlasData: WPAtlas[]
): Promise<LoadDataResult> {
    const url = '/syn_data.json'; // '/sim.json';

    const data: SynapseData = await fetch(url).then((r) => r.json());

    const flatData: Entity[] = extractEntitiesFromSynapseData(data);

    const files = flatData.filter((obj) => {
        return !!obj.filename;
    });

    addPrimaryParents(files);

    const biospecimen = flatData.filter((obj) => {
        return obj.Component === 'Biospecimen';
    });

    const diagnoses = flatData.filter((obj) => {
        return obj.Component === 'Diagnosis';
    });

    const atlasMap = _.keyBy(WPAtlasData, (a) => a.htan_id.toUpperCase());

    _.forEach(files, (file) => {
        // parse component to make a new level property and adjust component property
        if (file.Component) {
            const parsed = parseRawAssayType(file.Component);
            //file.Component = parsed.name;
            if (parsed.level && parsed.level.length > 1) {
                file.level = parsed.level;
            } else {
                file.level = 'Unknown';
            }
        } else {
            file.level = 'Unknown';
        }

        file.WPAtlas = atlasMap[file.atlasid.split('_')[0]];

        const parentData = getSampleAndPatientData(
            file,
            biospecimen,
            diagnoses
        );

        file.biospecimen = parentData.biospecimen;

        file.diagnosis = parentData.diagnosis;
    });

    const returnFiles = files.filter((f) => !!f.diagnosis);

    // filter out files without a diagnosis
    return { files: returnFiles, atlases: data.atlases };
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

export function parseRawAssayType(t: string) {
    // It comes in the form bts:CamelCase-NameLevelX (may or may not have that hyphen).
    // We want to take that and spit out { name: "Camel Case-Name", level: "Level X" }
    //  (with the exception that the prefixes Sc and Sn are always treated as lower case)

    // See if there's a Level in it
    const splitByLevel = t.split('Level');
    const level = splitByLevel.length > 1 ? `Level ${splitByLevel[1]}` : null;
    const extractedName = splitByLevel[0];
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
    return { name: t, level: null };
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

export function computeDashboardData(files: Entity[]) {
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
