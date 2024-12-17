export interface Phase2Center {
    navText: string;
    title: string;
    grantNumber: string;
    principalInvestigators: PrincipalInvestigator[];
    description: string;
}

export interface Phase2Centers {
    [key: string]: Phase2Center;
}

export interface PrincipalInvestigator {
    name: string;
    center: string;
    description?: string;
    isContact?: boolean;
}
