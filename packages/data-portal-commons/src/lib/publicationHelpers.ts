import _ from 'lodash';
import { SelectedFilter } from '@htan/data-portal-filter';
import { PublicationContentType, PublicationManifest } from './entity';
import { GeneralLink } from './types';

export function isManuscriptInReview(publication?: PublicationManifest) {
    return (
        publication?.PublicationContentType?.toLowerCase() ===
        PublicationContentType.Prepublication
    );
}

export function getPublicationUid(publication: PublicationManifest): string {
    const normalizeValue = (value: string) =>
        value.trim().toLowerCase().replace(/\s/g, '-').replace(/\./g, '');

    const center = publication.CenterID.toLowerCase();
    const year = publication.YearofPublication;
    const firstAuthor = normalizeValue(
        parsePublicationAuthors(publication?.Authors)[0]
    );
    // const titleFirstFiveWords = normalizeValue(publication.Title.split(/[\s/,\\]+/).slice(0,5).join(' '));
    const location = normalizeValue(publication.LocationofPublication);

    return `${center}_${year}_${location}_${firstAuthor}`;
}

export function getPublicationPubMedID(
    publication: PublicationManifest
): string {
    // we only need the numerical id, not the entire URL
    return publication && publication.PMID
        ? publication.PMID.replace(/[^0-9]/g, '')
        : '';
}

export function getCite(publication?: PublicationManifest): string | undefined {
    return publication
        ? `${getPublicationAuthors(publication)[0]} et al (${getPublicationYear(
              publication
          )})`
        : undefined;
}

export function getPublicationYear(
    publication?: PublicationManifest
): string | undefined {
    let year: string | undefined;

    if (publication?.EutilsSortDate) {
        year = publication?.EutilsSortDate.split('/')[0];
    } else {
        year = publication?.YearofPublication.toString();
    }

    return year;
}

export function getPublicationAuthors(
    publication?: PublicationManifest
): string[] {
    return parsePublicationAuthors(
        publication?.EutilsAuthors || publication?.Authors
    );
}

function parsePublicationAuthors(authors?: string): string[] {
    return authors?.split(',').map((a) => a.trim()) || [];
}

function getComponentFilters() {
    return [
        '10xVisiumSpatialTranscriptomics-RNA-seqLevel1',
        '10xVisiumSpatialTranscriptomics-RNA-seqLevel2',
        '10xVisiumSpatialTranscriptomics-RNA-seqLevel3',
        'BulkMethylation-seqLevel1',
        'BulkMethylation-seqLevel2',
        'BulkRNA-seqLevel1',
        'BulkRNA-seqLevel2',
        'BulkRNA-seqLevel3',
        'BulkDNALevel1',
        'BulkDNALevel2',
        'BulkDNALevel3',
        'ElectronMicroscopyLevel1',
        'ElectronMicroscopyLevel2',
        'ExSeqMinimal',
        'HI-C-seqLevel1',
        'HI-C-seqLevel2',
        'HI-C-seqLevel3',
        'ImagingLevel1',
        'ImagingLevel2',
        'ImagingLevel3Segmentation',
        'MassSpectrometryLevel1',
        'MassSpectrometryLevel3',
        'RPPALevel2',
        'RPPALevel3',
        'SRRSImagingLevel2',
        'ScATAC-seqLevel1',
        'ScATAC-seqLevel2',
        'ScATAC-seqLevel3',
        'ScRNA-seqLevel1',
        'ScRNA-seqLevel2',
        'ScRNA-seqLevel3',
        'Slide-seqLevel1',
        'Slide-seqLevel2',
        'Slide-seqLevel3',
    ].map((component) => ({
        group: 'Component',
        value: component,
    }));
}

export function getPublicationFilters(
    publication: PublicationManifest
): SelectedFilter[] {
    return [
        {
            group: 'publicationIds',
            value: getPublicationUid(publication),
        },
        // Remove this filter for now
        // ...getComponentFilters(),
    ];
}

export function getPublicationDOI(
    publication?: PublicationManifest
): string | undefined {
    let doi: string | undefined;

    if (publication?.EutilsDOI) {
        doi = publication?.EutilsDOI;
    } else if (publication?.DOI) {
        doi = publication?.DOI.replace('https://doi.org/', '');
    }

    return doi;
}

export function getPublicationAssociatedParentDataFileIDs(
    publication: PublicationManifest
): string[] {
    return publication.PublicationAssociatedParentDataFileID.split(
        ','
    ).map((a) => a.trim());
}

export function getPublicationJournal(
    publication?: PublicationManifest
): string | undefined {
    return isManuscriptInReview(publication)
        ? 'TBD'
        : (
              publication?.EutilsJournal?.toLowerCase() ||
              publication?.LocationofPublication
          )?.replace(/\w+/g, _.capitalize);
}

export function getPublicationTitle(
    publication?: PublicationManifest
): string | undefined {
    const title = publication?.EutilsTitle || publication?.Title;
    // remove trailing dot (if any)
    return title?.trim().replace(/\.$/, '');
}

export function getPublicationDate(publication?: PublicationManifest) {
    return (
        publication?.EutilsDate || publication?.YearofPublication?.toString()
    );
}

export function getPublicationSupportingLinks(
    publication?: PublicationManifest
): GeneralLink[] {
    const urls = publication?.SupportingLink
        ? publication.SupportingLink.split(',')
        : undefined;
    const descriptions = publication?.SupportingLinkDescription?.split('^^^');

    return (
        urls?.map((link, index) => ({
            link,
            name:
                descriptions && index < descriptions.length
                    ? descriptions[index]
                    : '',
        })) || []
    );
}

// export async function fetchPublicationSummaries(
//     pubMedIds?: string[],
//     dataUri: string = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?retmode=json&db=pubmed'
// ): Promise<{ [pubMedID: string]: PublicationSummary } | undefined> {
//     if (pubMedIds) {
//         try {
//             const res = await fetch(`${dataUri}&id=${pubMedIds.join(',')}`);
//
//             // const json = await res.json();
//             const text = await res.text();
//             const json = JSON.parse(text);
//
//             return json.result;
//         } catch {
//             return undefined;
//         }
//     }
//
//     return undefined;
// }

export function getAllPublicationPagePaths(ids: string[]) {
    return ids.map((id) => ({ params: { id } }));
}
