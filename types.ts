import { DataSchemaData } from './lib/dataSchemaHelpers';
import { Atlas } from './lib/helpers';
import { ExploreSelectedFilter, GenericAttributeNames } from './lib/types';

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

export interface AtlasMeta {
    title: { rendered: string };
    lead_institutions: string;
    htan_id: string;
    short_description?: string;
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
    filters: ExploreSelectedFilter[];
}

export interface Publication {
    id: string;
    publicationData: PublicationData;
}
