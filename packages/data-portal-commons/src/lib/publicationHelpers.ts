import fetch from 'node-fetch';
import _ from 'lodash';
import { SelectedFilter } from '@htan/data-portal-filter';
import { PublicationManifest, PublicationSummary } from './entity';
import { GeneralLink } from './types';

export function getPublicationUid(publication: PublicationManifest): string {
    const normalizeValue = (value: string) =>
        value.trim().toLowerCase().replace(/\s/g, '-').replace(/\./g, '');

    const center = publication.CenterID.toLowerCase();
    const year = publication.YearofPublication;
    const firstAuthor = normalizeValue(
        getPublicationAuthorsFromPublicationManifest(publication)[0]
    );
    // const titleFirstFiveWords = normalizeValue(publication.Title.split(/[\s/,\\]+/).slice(0,5).join(' '));
    const location = normalizeValue(publication.LocationofPublication);

    return `${center}_${year}_${location}_${firstAuthor}`;
}

export function getPublicationPubMedID(
    publication: PublicationManifest
): string {
    // we only need the numerical id, not the entire URL
    return publication.PMID.replace(/[^0-9]/g, '');
}

export function getCite(
    publicationSummary?: PublicationSummary,
    publicationManifest?: PublicationManifest
): string | undefined {
    let cite: string | undefined;

    if (publicationSummary) {
        cite = getCiteFromPublicationSummary(publicationSummary);
    } else if (publicationManifest) {
        cite = getCiteFromPublicationManifest(publicationManifest);
    }

    return cite;
}

export function getCiteFromPublicationManifest(
    publication: PublicationManifest
): string {
    return `${
        getPublicationAuthorsFromPublicationManifest(publication)[0]
    } et al (${publication.YearofPublication})`;
}

export function getCiteFromPublicationSummary(
    publication: PublicationSummary
): string {
    return `${
        getPublicationAuthorsFromPublicationSummary(publication)[0]
    } et al (${publication.sortpubdate.split('/')[0]})`;
}

export function getPublicationAuthors(
    publicationSummary?: PublicationSummary,
    publicationManifest?: PublicationManifest
): string[] {
    let authors: string[] = [];

    if (publicationSummary) {
        authors = getPublicationAuthorsFromPublicationSummary(
            publicationSummary
        );
    } else if (publicationManifest) {
        authors = getPublicationAuthorsFromPublicationManifest(
            publicationManifest
        );
    }

    return authors;
}

export function getPublicationAuthorsFromPublicationManifest(
    publication: PublicationManifest
): string[] {
    return publication.Authors.split(',').map((a) => a.trim());
}

export function getPublicationAuthorsFromPublicationSummary(
    publication: PublicationSummary
): string[] {
    return publication.authors.map((a) => a.name);
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
        ...getComponentFilters(),
    ];
}

export function getPublicationDOI(
    publicationSummary?: PublicationSummary,
    publicationManifest?: PublicationManifest
): string | undefined {
    let doi: string | undefined;

    if (publicationSummary) {
        doi = getPublicationDoiFromPublicationSummary(publicationSummary);
    } else if (publicationManifest) {
        doi = getPublicationDoiFromPublicationManifest(publicationManifest);
    }

    return doi;
}

export function getPublicationDoiFromPublicationManifest(
    publication: PublicationManifest
): string {
    return publication.DOI.replace('https://doi.org/', '');
}

export function getPublicationDoiFromPublicationSummary(
    publication: PublicationSummary
): string | undefined {
    return publication.articleids.find((id) => id.idtype === 'doi')?.value;
}

export function getPublicationAssociatedParentDataFileIDs(
    publication: PublicationManifest
): string[] {
    return publication.PublicationAssociatedParentDataFileID.split(
        ','
    ).map((a) => a.trim());
}

export function getPublicationJournal(
    publicationSummary?: PublicationSummary,
    publicationManifest?: PublicationManifest
): string | undefined {
    return (
        _.upperFirst(publicationSummary?.fulljournalname?.toLowerCase()) ||
        publicationManifest?.LocationofPublication
    );
}

export function getPublicationTitle(
    publicationSummary?: PublicationSummary,
    publicationManifest?: PublicationManifest
): string | undefined {
    return publicationSummary?.title || publicationManifest?.Title;
}

export function getPublicationSupportingLinks(
    publicationManifest?: PublicationManifest
): GeneralLink[] {
    const urls = publicationManifest?.SupportingLink?.split(',');
    const descriptions = publicationManifest?.SupportingLinkDescription?.split(
        '^^^'
    );

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

export async function fetchPublicationSummaries(
    pubMedIds?: string[],
    dataUri: string = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?retmode=json&db=pubmed'
): Promise<{ [pubMedID: string]: PublicationSummary } | undefined> {
    if (pubMedIds) {
        try {
            const res = await fetch(`${dataUri}&id=${pubMedIds.join(',')}`);

            // const json = await res.json();
            const text = await res.text();
            const json = JSON.parse(text);

            return json.result;
        } catch {
            return undefined;
        }
    }

    return undefined;
}

export function getAllPublicationPagePaths(ids: string[]) {
    return ids.map((id) => ({ params: { id } }));
}
