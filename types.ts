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
