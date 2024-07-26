import _ from 'lodash';
import { NextRouter } from 'next/router';

import {
    SelectedFilter,
    urlEncodeSelectedFilters,
} from '@htan/data-portal-filter';
import {
    Entity,
    fetchSynData,
    LoadDataResult,
} from '@htan/data-portal-commons';
import { ExploreTab } from '@htan/data-portal-explore';

// @ts-ignore
let win;

if (typeof window !== 'undefined') {
    win = window as any;
} else {
    win = {} as any;
}

export type ExploreURLQuery = {
    selectedFilters: string | undefined;
    tab: ExploreTab;
};

win.missing = [];

function doesFileHaveMultipleParents(file: Entity) {
    return /Level[456]/.test(file.Component);
}

export function getCloudBaseUrl() {
    return 'https://d13ch66cwesneh.cloudfront.net';
}

export async function fetchData(): Promise<LoadDataResult> {
    // in development we use local processed syn data. In production we use
    // other URL (too large to serve thru next max 250MB limit)
    const processedSynURL =
        process.env.NODE_ENV === 'development'
            ? '/processed_syn_data.json'
            : `${getCloudBaseUrl()}/processed_syn_data_20240808_0718.json`;
    return fetchSynData(processedSynURL);
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

export function isReleaseQCEnabled() {
    const urlParams = new URLSearchParams(window.location.search);
    return (
        urlParams.has('rel') || urlParams.has('release') || urlParams.has('qc')
    );
}
