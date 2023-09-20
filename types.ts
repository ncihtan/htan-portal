import { DataSchemaData } from './lib/dataSchemaHelpers';
import { Atlas } from './lib/helpers';
import { SelectedFilter } from './packages/data-portal-filter/src/libs/types';
import { GenericAttributeNames } from './packages/data-portal-utils/src/libs/types';

export interface CmsData {
    slug: string;
    content: {
        rendered: string;
        protected: boolean;
    };
    title: {
        rendered: string;
    };
}

export interface SubCategory {
    data: {
        attributes: Attribute[];
        values: any[];
    };
    dataLink: string;
}

export interface Attribute {
    name: string;
    description: string;
    schemaMetadata: { renderType?: string };
}

export interface Category {
    [subcat: string]: SubCategory;
}

export interface Author {
    name: string;
    email: string;
}

export interface GeneralLink {
    name: string;
    link: string;
}

export interface PublicationInfo {
    journal: GeneralLink;
    pubmed: GeneralLink;
    DOI: GeneralLink;
    atlas: GeneralLink;
}

export interface PublicationData {
    title: string;
    abstract: string;
    synapseAtlas: Atlas;
    authors: string[];
    correspondingAuthors: Author[];
    publicationInfo: PublicationInfo;
    schemaDataById: {
        [schemaDataId: string]: DataSchemaData;
    };
    genericAttributeMap?: { [attr: string]: GenericAttributeNames };
    filters: SelectedFilter[];
}

export interface Publication {
    id: string;
    publicationData: PublicationData;
}
