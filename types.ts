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

export enum HtaCenterPhase {
    Phase1 = 'phase1',
    Phase2 = 'phase2',
    DCC = 'dcc',
}

export interface HtaCenter {
    phase: HtaCenterPhase;
    title: string;
    grantNumber?: string;
    principalInvestigators: PrincipalInvestigator[];
    description: string | string[];
    customURL?: string;
}

export interface HtaCenters {
    [key: string]: HtaCenter;
}

export interface PrincipalInvestigator {
    name: string;
    center: string;
    description?: string;
    isContact?: boolean;
}
