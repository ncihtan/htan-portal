import { Atlas, Entity } from './helpers';

export type ExploreOptionType = {
    value: string;
    label: string;
    group: string;
    count?: number;
};

export type ExploreSelectedFilter = {
    group: string;
    value: string;
}

export enum PropNames {
    TissueorOrganofOrigin = 'TissueorOrganofOrigin',
    PrimaryDiagnosis = 'PrimaryDiagnosis',
    Component = 'Component',
    Biospecimen = 'Biospecimen',
    AtlasName = 'AtlasName',
    Stage = 'Stage',
    Level = 'Level',
    FileFormat = 'FileFormat'
}

export const PropMap = {
    [PropNames.TissueorOrganofOrigin]: {
        prop: 'diagnosis.TissueorOrganofOrigin',
        displayName: 'Organ',
    },
    [PropNames.PrimaryDiagnosis]: {
        prop: 'diagnosis.PrimaryDiagnosis',
        displayName: 'Diagnosis',
    },
    [PropNames.Component]: {
        prop: 'Component',
        displayName: 'Assay',
    },
    [PropNames.Biospecimen]: {
        prop: 'Biospecimen',
        displayName: 'Biospecimen',
    },
    [PropNames.AtlasName]: {
        prop: 'WPAtlas.title.rendered',
        displayName: 'Atlas',
    },
    [PropNames.Stage]: {
        prop: 'diagnosis.AJCCPathologicStage',
        displayName: 'Stage',
    },
    [PropNames.Level]: {
        prop: 'level',
        displayName: 'Level',
    },
    [PropNames.FileFormat]: {
        prop: 'fileFormat',
        displayName: 'File Format'
    }
};

export interface IFilterProps {
    files: Entity[];
    filters: { [key: string]: string[] };
    atlases: Atlas[];
    atlasData?: any;
}

export interface IFiltersByGroupName {
    [groupName: string]: ExploreSelectedFilter[];
}
