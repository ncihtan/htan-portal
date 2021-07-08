import { DataSchemaData } from './dataSchemaHelpers';
import { Atlas, Entity } from './helpers';
import { ActionMeta, ActionTypes, OptionTypeBase } from 'react-select';
import _ from 'lodash';

export type ExploreOptionType = {
    value: string;
    label: string;
    group: string;
    count?: number;
    isSelected?: boolean;
};

export type ExploreSelectedFilter = {
    group: string;
    value: string;
};

export enum AttributeNames {
    // Synapse attribute names
    TissueorOrganofOrigin = 'TissueorOrganofOrigin',
    PrimaryDiagnosis = 'PrimaryDiagnosis',
    Gender = 'Gender',
    Race = 'Race',
    Ethnicity = 'Ethnicity',
    CountryofResidence = 'CountryofResidence',
    Component = 'Component',
    Biospecimen = 'Biospecimen',
    AtlasName = 'AtlasName',
    Stage = 'Stage',
    Level = 'Level',
    FileFormat = 'FileFormat',

    // Derived or attached in frontend
    assayName = 'assayName',
}

export interface IAttributeInfo {
    path?: string;
    getValues?: (e: Entity) => string[];
    displayName: string;
}

export const AttributeMap: { [attr in AttributeNames]: IAttributeInfo } = {
    [AttributeNames.TissueorOrganofOrigin]: {
        getValues: (e: Entity) =>
            _.uniq(e.diagnosis.map((d) => d.TissueorOrganofOrigin)),
        displayName: 'Organ',
    },
    [AttributeNames.PrimaryDiagnosis]: {
        getValues: (e: Entity) =>
            _.uniq(e.diagnosis.map((d) => d.PrimaryDiagnosis)),
        displayName: 'Disease Type',
    },
    [AttributeNames.Race]: {
        getValues: (e: Entity) =>
            _.uniq(e.demographics.map((d) => d.Race)),
        displayName: 'Race',
    },
    [AttributeNames.Ethnicity]: {
        getValues: (e: Entity) =>
            _.uniq(e.demographics.map((d) => d.Ethnicity)),
        displayName: 'Ethnicity',
    },
    [AttributeNames.CountryofResidence]: {
        getValues: (e: Entity) =>
            _.uniq(e.demographics.map((d) => d.CountryofResidence)),
        displayName: 'Country of Residence',
    },
    [AttributeNames.Gender]: {
        getValues: (e: Entity) =>
            _.uniq(e.demographics.map((d) => d.Gender)),
        displayName: 'Gender',
    },
    [AttributeNames.Component]: {
        path: 'Component',
        displayName: 'Assay',
    },
    [AttributeNames.Biospecimen]: {
        path: 'Biospecimen',
        displayName: 'Biospecimen',
    },
    [AttributeNames.AtlasName]: {
        path: 'atlas_name',
        displayName: 'Atlas',
    },
    [AttributeNames.Stage]: {
        getValues: (e: Entity) =>
            _.uniq(e.diagnosis.map((d) => d.AJCCPathologicStage)),
        displayName: 'Stage',
    },
    [AttributeNames.Level]: {
        path: 'level',
        displayName: 'Level',
    },
    [AttributeNames.FileFormat]: {
        path: 'fileFormat',
        displayName: 'File Format',
    },
    [AttributeNames.assayName]: {
        path: 'assayName',
        displayName: 'Assay',
    },
};

export interface IFilterProps {
    files: Entity[];
    filters: { [key: string]: string[] };
    schemaDataById?: { [schemaDataId: string]: DataSchemaData };
    atlases: Atlas[];
    atlasData?: any;
}

export interface ISelectedFiltersByAttrName {
    [groupName: string]: Set<string>;
}

export enum FilterAction {
    CLEAR_ALL = 'clear-all',
    // these strings are hard-coded in react-select
    CLEAR = 'clear',
    SELECT = 'select-option',
    DESELECT = 'deselect-option',
}

export interface ExploreActionMeta<OptionType extends OptionTypeBase>
    extends Omit<ActionMeta<OptionType>, 'action'> {
    action: ActionTypes | FilterAction;
}

export type SynapseData = {
    atlases: SynapseAtlas[];
    schemas: SynapseSchema[];
};

export type SynapseAtlas = {
    htan_id: string;
    htan_name: string;
} & {
    [data_schema: string]: SynapseRecords;
};

export type SynapseRecords = {
    data_schema: string;
    record_list: { values: any[] }[];
};

export type SynapseSchema = {
    data_schema: string;
    attributes: {
        id: string;
        display_name: string;
        description: string;
    }[];
};
