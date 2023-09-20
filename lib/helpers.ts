import _ from 'lodash';
import { NextRouter } from 'next/router';
import fetch from 'node-fetch';
import * as Path from 'path';

import { ExploreURLQuery } from '../pages/explore';
import { ExploreTab } from '../components/ExploreTabs';
import { SelectedFilter } from '../packages/data-portal-filter/src/libs/types';
import {
    AtlasMeta,
    BaseSerializableEntity,
    Entity,
    SerializableEntity,
} from '../packages/data-portal-commons/src/libs/entity';

// @ts-ignore
let win;

if (typeof window !== 'undefined') {
    win = window as any;
} else {
    win = {} as any;
}

export interface ReleaseEntity {
    entityId: string;
    Data_Release: string;
    Id: string;
    type: string;
    CDS_Release: string;
    IDC_Release: string;
    Component: string;
}

export type Atlas = {
    htan_id: string;
    htan_name: string;
    num_cases: number;
    num_biospecimens: number;
    AtlasMeta: AtlasMeta;
};

export interface LoadDataResult {
    files: SerializableEntity[];
    atlases: Atlas[];
    biospecimenByBiospecimenID: {
        [BiospecimenID: string]: SerializableEntity;
    };
    diagnosisByParticipantID: {
        [ParticipantID: string]: SerializableEntity;
    };
    demographicsByParticipantID: {
        [ParticipantID: string]: SerializableEntity;
    };
}

win.missing = [];

function doesFileHaveMultipleParents(file: Entity) {
    return /Level[456]/.test(file.Component);
}

export function isLowestLevel(entity: BaseSerializableEntity) {
    return entity.Islowestlevel?.toLowerCase().startsWith('yes');
}

export function doesFileIncludeLevel1OrLevel2SequencingData(file: Entity) {
    return (
        !file.Component.startsWith('Imaging') &&
        (file.level === 'Level 1' || file.level === 'Level 2')
    );
}

function mergeCaseData(
    diagnosis: Entity[],
    demographicsByParticipantID: { [participantID: string]: Entity }
) {
    return diagnosis.map((d) => ({
        ...d,
        ...demographicsByParticipantID[d.ParticipantID],
    }));
}

export async function fetchData(): Promise<LoadDataResult> {
    // in development we use local processed syn data. In production we use
    // other URL (too large to serve thru next max 250MB limit)
    const processedSynURL =
        process.env.NODE_ENV === 'development'
            ? '/processed_syn_data.json'
            : 'https://d13ch66cwesneh.cloudfront.net/processed_syn_data_20231201_1832.json';
    const res = await fetch(processedSynURL);

    // const json = await res.json();
    const text = await res.text();
    const json = JSON.parse(text);

    //window.myJSON = JSON.parse(text);

    return json as LoadDataResult;
}

export function fillInEntities(data: LoadDataResult): Entity[] {
    const biospecimenMap = data.biospecimenByBiospecimenID;
    const diagnosisMap = data.diagnosisByParticipantID;
    const demoMap = data.demographicsByParticipantID;

    // give each biospecimen it's caseid (i.e "diagnosis" HTANParticipantID)
    // biospecimen have HTANParentID but that may or may not be it's caseid because
    // biospecimen can have other biospecimen as parents (one case at top)
    _.forEach(data.biospecimenByBiospecimenID, (specimen) => {
        const parentIdMatch = specimen.ParentID.match(/[^_]*_[^_]*/);
        // we should always have a match
        specimen.ParticipantID =
            specimen.ParticipantID || (parentIdMatch ? parentIdMatch[0] : '');
    });

    // TODO we cannot do this, we need to deal with this in a different way in Plots tab
    // data.files = data.files.filter((f) => {
    //     return f.demographicsIds.length > 0 && f.diagnosisIds.length > 0;
    // });

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
            (c) => c.ParticipantID
        );
    });

    return data.files as Entity[];
}

// TODO this function doesn't seem to be used anywhere anymore
// export function sortStageOptions(options: OptionType[]) {
//     const sortedOptions = _.sortBy(options, (option) => {
//         const numeral = option.value.match(/stage ([IVXLCDM]+)/i);
//         let val = undefined;
//         if (!!numeral && numeral.length > 1) {
//             try {
//                 const number = toArabic(numeral[1]);
//             } catch (ex) {
//                 val = numeral[1];
//             }
//         }
//         return option.label;
//     });
//
//     const withStage = sortedOptions.filter((option) =>
//         /stage/i.test(option.label)
//     );
//     const withoutStage = sortedOptions.filter(
//         (option) => !/stage/i.test(option.label)
//     );
//
//     return withStage.concat(withoutStage);
// }

export function urlEncodeSelectedFilters(selectedFilters: SelectedFilter[]) {
    // it is possible to pass OptionType[] here for selected filters, and
    // JSON.stringify() breaks when OptionType.label is an instance of JSX.Element so we need to exclude it
    return JSON.stringify(selectedFilters.map((f) => _.omit(f, ['label'])));
}

export function parseSelectedFiltersFromUrl(
    selectedFiltersURLQueryParam: string | undefined
): SelectedFilter[] | null {
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

export function getExplorePageURL(tab: ExploreTab, filters: SelectedFilter[]) {
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
    filters: SelectedFilter[],
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
            uniqueBiospecs.add(biospec.BiospecimenID);
        }
        for (const diag of file.diagnosis) {
            uniqueCases.add(diag.ParticipantID);
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

export function filterObject(
    object: any,
    filter: (val: any, key: any) => boolean
) {
    const filteredObj: any = {};
    _.forEach(object, (val, key) => {
        if (filter(val, key)) {
            filteredObj[key] = val;
        }
    });
    return filteredObj;
}

export function selectorToColumnName(selector: string) {
    // capitalize first letter always
    let str = `${selector[0].toUpperCase()}${selector.substr(1)}`;
    // insert a space before each capital letter that has a lower case letter after it
    str = str.replace(/([A-Z])(?=[a-z])/g, ' $1');
    // insert a space after each lower case letter that has a capital after it
    str = str.replace(/([a-z])(?=[A-Z])/g, '$1 ');
    // remove any trailing spaces
    str = str.trim();

    return str;
}

export function isReleaseQCEnabled() {
    const urlParams = new URLSearchParams(window.location.search);
    return (
        urlParams.has('rel') || urlParams.has('release') || urlParams.has('qc')
    );
}
