import _ from 'lodash';
import { NextRouter } from 'next/router';
import fetch from 'node-fetch';
import { toArabic } from 'roman-numerals';

import { WPAtlas } from '../types';
import { ExploreOptionType, ExploreSelectedFilter } from './types';
import { ExploreURLQuery } from '../pages/explore';
import { AtlasURLQuery } from '../pages/atlas/[id]';

// @ts-ignore
let win;

if (typeof window !== 'undefined') {
    win = window as any;
} else {
    win = {} as any;
}

export function getRecords(obj: any): any {
    if (_.isObject(obj) || _.isArray(obj)) {
        return _.map(obj, (n: any) => {
            if (n.record_list) {
                return n.record_list;
            } else {
                return getRecords(n);
            }
        });
    } else {
        return undefined;
    }
}

export function massageData(data: any): Entity[] {
    _.forEach(data.atlases, (atlas) => {
        _.forEach(atlas, (t) => {
            const schemaName = t.data_schema;
            if (schemaName) {
                const schema = data.schemas.find(
                    (s: any) => s.data_schema === schemaName
                );
                //console.log("here", schema.attributes);

                t.fields = schema.attributes;

                //console.log(t.fields);

                t.record_list = t.record_list.map((record: any) => {
                    const obj: any = {};

                    t.fields.forEach((f: any, i: number) => {
                        obj[f.id.replace(/^bts:/, '')] = record.values[i];
                    });

                    obj['atlasid'] = atlas.htan_id;

                    return obj;
                });
            }
        });
    });

    const objs = _.chain(getRecords(data))
        .flatMapDeep()
        .filter((n) => !!n)
        .value();

    return objs;
}

export interface Entity {
    HTANBiospecimenID: any;
    atlasid: string;
    AssayType: string;
    Component: string;
    HTANParentID: string;
    HTANDataFileID: string;
    HTANParentBiospecimenID: string;
    HTANParentDataFileID: string;
    TissueorOrganofOrigin: string;
    PrimaryDiagnosis: string;
    fileFormat: string;
    filename: string;
    HTANParticipantID: string;
    level: string;
    WPAtlas: WPAtlas;
    biospecimen: Entity | undefined;
    diagnosis: Entity | undefined;
    primaryParent?: Entity;
    primaryParents?: Entity[];
}

export interface Atlas {
    htan_id: string;
    htan_name: string;
}

export interface LoadDataResult {
    files: Entity[];
    atlases: Atlas[];
}

function seekPrimaryParent(
    f: Entity,
    byIdMap: { [k: string]: Entity }
): Entity {
    if (!f.HTANParentDataFileID) {
        return f;
    } else {
        const parent = byIdMap[f.HTANParentDataFileID.split(',')[0]];
        if (!parent) {
            throw 'Invalid HTANParentDataFileID';
        } else {
            return seekPrimaryParent(parent, byIdMap);
        }
    }
}

win.missing = [];

function seekPrimaryParents(
    f: Entity,
    byIdMap: { [k: string]: Entity }
): Entity[] {
    let parents: Entity[] = [];

    if (!f.HTANParentDataFileID) {
        // leave it empty
        parents.push(f);
    } else {
        const parentIds = f.HTANParentDataFileID.split(/[,;]/);
        const parentFiles = parentIds.reduce((aggr: Entity[], id: string) => {
            const file = byIdMap[id];
            if (file) {
                aggr.push(file);
            } else {
                // @ts-ignore
                (win as any).missing.push(id);
            }
            return aggr;
        }, []);

        const sought = _(parentFiles)
            .map((f) => seekPrimaryParents(f, byIdMap))
            .flatten()
            .uniq()
            .value();

        parents = _.uniq(parents.concat(sought));
    }

    return parents;
}

function handleLineage(files: Entity[]) {
    // first get rid of level >=4
    // they have multiple parents
    let cleanFiles = files.filter((f) => {
        return !/Level[456]/.test(f.Component);
    });

    const byIdMap = _.keyBy(cleanFiles, (f) => f.HTANDataFileID);

    cleanFiles.forEach((f) => {
        // const primaryParent = seekPrimaryParent(f, byIdMap);
        // if (f !== primaryParent) {
        //     f.primaryParent = primaryParent;
        // }

        const primaryParents = seekPrimaryParents(f, byIdMap);

        if (primaryParents[0] !== f) {
            f.primaryParents = primaryParents;
        }
    });

    console.log(cleanFiles);
}

function getSampleAndPatientData(
    file: Entity,
    biospecimen: Entity[],
    diagnoses: Entity[]
) {
    const topLevelFile = file.primaryParent || file;

    let diagnosis, specimen;

    specimen = _.find(biospecimen, {
        HTANBiospecimenID: topLevelFile.HTANParentBiospecimenID,
    }) as Entity | undefined;

    if (specimen) {
        diagnosis = _.find(diagnoses, {
            HTANParticipantID: specimen.HTANParentID,
        }) as Entity | undefined;
    }

    return { specimen, diagnosis };
}

export async function loadData(
    WPAtlasData: WPAtlas[]
): Promise<LoadDataResult> {
    const url = '/syn_data.json'; // '/sim.json';

    const data = await fetch(url).then((r) => r.json());

    const flatData: Entity[] = massageData(data);

    let files = flatData.filter((obj) => {
        return !!obj.filename;
    });

    handleLineage(files);

    const biospecimen = flatData.filter((obj) => {
        return obj.Component === 'Biospecimen';
    });

    const cases = flatData.filter((obj) => {
        return obj.Component === 'Demographics';
    });

    const diagnoses = flatData.filter((obj) => {
        return obj.Component === 'Diagnosis';
    });

    const atlasMap = _.keyBy(WPAtlasData, (a) => a.htan_id);

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

        file.biospecimen = parentData.specimen;

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

export function getExplorePageURL(filters: ExploreSelectedFilter[]) {
    let url = '/explore';
    if (filters.length > 0) {
        const query: ExploreURLQuery = {
            selectedFilters: urlEncodeSelectedFilters(filters),
        }; // using this intermediate container to use typescript to enforce URL correctness
        url = addQueryStringToURL(url, query);
    }
    return url;
}

export function getAtlasPageURL(id: string) {
    const query: AtlasURLQuery = {
        fromApp: 'true',
    }; // using this intermediate container to use typescript to enforce URL correctness
    return addQueryStringToURL(`/atlas/${id}`, query);
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
        uniqueAtlases.add(file.atlasid);
        uniqueOrgans.add(file.TissueorOrganofOrigin);
        uniqueBiospecs.add(file.biospecimen);
        uniqueCases.add(file.diagnosis!.HTANParticipantID);
    }
    return [
        { description: 'Atlases', text: uniqueAtlases.size.toString() },
        { description: 'Organs', text: uniqueOrgans.size.toString() },
        { description: 'Cases', text: uniqueCases.size.toString() },
        { description: 'Biospecimens', text: uniqueBiospecs.size.toString() },
    ];
}
