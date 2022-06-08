import { DataSchemaData } from './lib/dataSchemaHelpers';
import { Atlas, Entity } from './lib/helpers';
import { ExploreSelectedFilter } from './lib/types';

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

export enum WPConstants {
    HOMEPAGE_HERO_BLURB = 'homepage-hero-blurb',
}

export interface WPAtlas {
    id: number;
    slug: string;
    title: { rendered: string };
    content: { rendered: string };
    atlas_overview: string;
    data_overview: string;
    publications: string;
    lead_institutions: string;
    atlas_type: string;
    synapse_id: string;
    htan_id: string;
    primary_ngs: string;
    short_description: string;
    home_image: { guid: string };
}

export interface Institute {
    name: string;
    link?: string;
}

export interface ToolsExample {
    exampleCaseName: string;
    exampleCaseCbioportalLink: string;
    exampleCaselMinervaLink: string;
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
}

export interface PublicationData {
    title: string;
    leadInstitute: Institute;
    abstract: string;
    synapseAtlas: Atlas;
    biospecimens: Entity[];
    toolsExample: ToolsExample;
    authors: Author[];
    publicationInfo: PublicationInfo;
    cases: Entity[];
    images: Entity[];
    sequences: Entity[];
    schemaDataById: {
        [schemaDataId: string]: DataSchemaData;
    };
    levelData: {
        [attrValue: string]: Entity[];
    };
}

export interface Publication {
    id: string;
    publicationData: PublicationData;
}
