import _ from 'lodash';
import fetch from 'node-fetch';
import { WPAtlas } from '../types';
import {ExploreOptionType} from "./types";
import {toArabic} from "roman-numerals";

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
                    (s: any) => s.data_schema === schemaName.split(':')[1]
                );
                //console.log("here", schema.attributes);
                t.fields = schema.attributes;

                //console.log(t.fields);

                t.record_list = t.record_list.map((record: any) => {
                    const obj: any = {};

                    t.fields.forEach((f: any, i: number) => {
                        obj[f.id.replace(/^bts:/, '')] = record[i];
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
    atlasid: string;
    AssayType: string;
    Component: string;
    HTANDataFileID: string;
    HTANParentBiospecimenID: string;
    TissueorOrganofOrigin: string;
    PrimaryDiagnosis: string;
    fileFormat: string;
    filename: string;
    HTANParentID: string;
    level: string;
    WPAtlas: WPAtlas;
    biospecimen: Entity | undefined;
    diagnosis: Entity | undefined;
}

export interface Atlas {
    htan_id: string;
    htan_name: string;
}

export interface LoadDataResult {
    files: Entity[];
    atlases: Atlas[];
}

export async function loadData(WPAtlasData: WPAtlas[]):Promise<LoadDataResult> {
    const data = await fetch('/sim.json').then((r) => r.json());

    const flatData: Entity[] = massageData(data);

    const files = flatData.filter((obj) => {
        return !!obj.filename;
    });

    const biospecimen = flatData.filter((obj) => {
        return obj.Component === 'bts:Biospecimen';
    });

    const cases = flatData.filter((obj) => {
        return obj.Component === 'bts:Demographics';
    });

    const casesByIdMap = _.keyBy(cases,(c)=>c.HTANParentID);

    const diagnoses = flatData.filter((obj) => {
        return obj.Component === 'bts:Diagnosis';
    });

    const atlasMap = _.keyBy(WPAtlasData, (a) => a.htan_id);

    _.forEach(files, (file) => {

        // parse component to make a new level property and adjust component property
        if (file.Component) {
            const parsed = parseRawAssayType(file.Component);
            file.Component = parsed.name;
            if (parsed.level && parsed.level.length > 1) {
                file.level = parsed.level;
            } else {
                file.level = "Unknown";
            }
        } else {
            file.level = "Unknown";
        }

        //file.case = casesByIdMap[file.HTANParentID];

        file.WPAtlas =
            atlasMap[
                `hta${Number(file.atlasid.split('_')[0].substring(3)) + 1}`
            ];

        const specimen = _.find(biospecimen, {
            HTANBiospecimenID: file.HTANParentBiospecimenID,
        }) as Entity | undefined;

        if (specimen) {
            //console.log(specimen);

            const diagnosis = _.find(diagnoses, {
                HTANParticipantID: specimen.HTANParentID,
            }) as Entity | undefined;
            file.diagnosis = diagnosis;
        }

        file.biospecimen = specimen;
        //file.participant =
    });

    return { files, atlases: data.atlases };
}



export function sortStageOptions(options:ExploreOptionType[]){

    const sortedOptions = _.sortBy(options,(option)=>{
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

    const withStage = sortedOptions.filter((option)=>/stage/i.test(option.label));
    const withoutStage = sortedOptions.filter((option)=>!/stage/i.test(option.label));

    return withStage.concat(withoutStage);

    //return options;
}

export function clamp(x:number, lower:number, upper:number) {
    return Math.max(lower, Math.min(x, upper));
}

export function parseRawAssayType(t:string) {
    // It comes in the form bts:CamelCase-NameLevelX (may or may not have that hyphen).
    // We want to take that and spit out { name: "Camel Case-Name", level: "Level X" }
    //  (with the exception that the prefixes Sc and Sn are always treated as lower case)

    // See if there's a Level in it
    const splitByLevel = t.split("Level");
    const level = splitByLevel.length > 1 ? `Level ${splitByLevel[1]}` : null;
    const extractedName = splitByLevel[0].match(/bts:(.+)/);
    if (extractedName && extractedName[1]) {
        // Convert camel case to space case
        // Source: https://stackoverflow.com/a/15370765
        let name = extractedName[1].replace( /([A-Z])([A-Z])([a-z])|([a-z])([A-Z])/g, '$1$4 $2$3$5' );

        // special case: sc as prefix
        name = name.replace(/\bSc /g, "sc");

        // special case: sn as prefix
        name = name.replace(/\bSn /g, "sn");

        return { name, level };
    }

    // Couldn't parse
    return { name: t, level: null };
}