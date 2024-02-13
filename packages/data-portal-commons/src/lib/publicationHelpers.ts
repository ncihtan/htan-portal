import fetch from 'node-fetch';
import _ from 'lodash';
import { SelectedFilter } from '@htan/data-portal-filter';
import { PublicationManifest, PublicationSummary } from './entity';
import { GeneralLink } from './types';

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

export function getPublicationFilters(
    publication: PublicationManifest
): SelectedFilter[] {
    return [
        {
            group: 'publicationIds',
            value: getPublicationPubMedID(publication),
        },
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
