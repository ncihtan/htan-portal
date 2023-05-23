import { DataSchemaData } from './dataSchemaHelpers';
import { Atlas, Entity, getDelimitedValues } from './helpers';
import { ActionMeta, ActionTypes, OptionTypeBase } from 'react-select';
import _ from 'lodash';
import { Tool } from './tools';

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
    id?: string;
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
    downloadSource = 'downloadSource',
    releaseVersion = 'releaseVersion',
}

export enum ToolAttributeNames {
    AtlasName = 'AtlasName',
    ToolType = 'ToolType',
    ToolLanguage = 'ToolLanguage',
    ToolTopic = 'ToolTopic',
    ToolAssay = 'ToolAssay',
    // ToolName = 'ToolName',
    // ToolPublication = 'ToolPublication',
    // ToolDescription = 'ToolDescription',
}

export enum DownloadSourceCategory {
    dbgap = 'dbGaP',
    idc = 'IDC',
    idcDbgap = 'dbGaP and IDC',
    synapse = 'Synapse',
    comingSoon = 'Coming Soon',
}

export interface IAttributeInfo<T> {
    path?: string;
    getValues?: (e: T) => string[];
    displayName: string;
    caseFilter?: boolean;
}

function getCaseValues(propName: keyof Entity) {
    return (e: Entity) => {
        if (e.cases) {
            return _.uniq(e.cases.map((c) => c[propName] as string));
        } else {
            return [e[propName] as string];
        }
    };
}

export const ToolAttributeMap: {
    [attr in ToolAttributeNames]: IAttributeInfo<Tool>;
} = {
    [ToolAttributeNames.AtlasName]: {
        displayName: 'Atlas',
        getValues: (tool: Tool) => getDelimitedValues(tool['Atlas Name']),
    },
    [ToolAttributeNames.ToolType]: {
        displayName: 'Type',
        getValues: (tool: Tool) => getDelimitedValues(tool['Tool Type']),
    },
    [ToolAttributeNames.ToolLanguage]: {
        displayName: 'Language',
        getValues: (tool: Tool) => getDelimitedValues(tool['Tool Language']),
    },
    [ToolAttributeNames.ToolTopic]: {
        displayName: 'Topic',
        getValues: (tool: Tool) => getDelimitedValues(tool['Tool Topic']),
    },
    [ToolAttributeNames.ToolAssay]: {
        displayName: 'Assay',
        getValues: (tool: Tool) =>
            tool['Tool Assay'] ? getDelimitedValues(tool['Tool Assay']) : [],
    },
};

export const FileAttributeMap: {
    [attr in AttributeNames]: IAttributeInfo<Entity>;
} = {
    [AttributeNames.TissueorOrganofOrigin]: {
        getValues: getCaseValues('TissueorOrganofOrigin'),
        displayName: 'Organ',
        caseFilter: true,
    },
    [AttributeNames.PrimaryDiagnosis]: {
        getValues: getCaseValues('PrimaryDiagnosis'),
        displayName: 'Disease',
        caseFilter: true,
    },
    [AttributeNames.Race]: {
        getValues: getCaseValues('Race'),
        displayName: 'Race',
        caseFilter: true,
    },
    [AttributeNames.Ethnicity]: {
        getValues: getCaseValues('Ethnicity'),
        displayName: 'Ethnicity',
        caseFilter: true,
    },
    [AttributeNames.CountryofResidence]: {
        getValues: getCaseValues('CountryofResidence'),
        displayName: 'Country of Residence',
        caseFilter: true,
    },
    [AttributeNames.Gender]: {
        getValues: getCaseValues('Gender'),
        displayName: 'Gender',
        caseFilter: true,
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
        getValues: getCaseValues('AJCCPathologicStage'),
        displayName: 'Stage',
        caseFilter: true,
    },
    [AttributeNames.Level]: {
        path: 'level',
        displayName: 'Level',
    },
    [AttributeNames.FileFormat]: {
        path: 'FileFormat',
        displayName: 'File Format',
    },
    [AttributeNames.assayName]: {
        path: 'assayName',
        displayName: 'Assay',
    },
    [AttributeNames.downloadSource]: {
        path: 'downloadSource',
        displayName: 'Data Access',
    },
    [AttributeNames.releaseVersion]: {
        path: 'releaseVersion',
        displayName: 'Release',
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
    column_order: string[];
};
