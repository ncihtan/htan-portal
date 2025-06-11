export enum ExploreTab {
    FILE = 'file',
    ATLAS = 'atlas',
    BIOSPECIMEN = 'biospecimen',
    CASES = 'cases',
    PUBLICATION = 'publication',
    PLOTS = 'plots',
}

// TODO we may want to generalize this
export type CountByType = {
    val: string;
    type: string;
    fieldType: string;
    count: string | number;
};
