export interface Phase2Center {
    navText: string;
    title: string;
    grantNumber: string;
    principalInvestigators: string[];
    description: string;
}

export interface Phase2Centers {
    [key: string]: Phase2Center;
}
