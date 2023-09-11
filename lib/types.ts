import { Atlas, Entity, getDelimitedValues } from './helpers';
import _ from 'lodash';
import { Tool } from './tools';
import { DataSchemaData } from './dataSchemaHelpers';

import {
    AttributeNames,
    GenericAttributeNames,
    IAttributeInfo,
} from '../packages/data-portal-utils/src/libs/types';

export enum HTANAttributeNames {
    HTANParentID = 'HTANParentID',
    HTANBiospecimenID = 'HTANBiospecimenID',
    HTANDataFileID = 'HTANDataFileID',
    HTANParticipantID = 'HTANParticipantID',
    HTANParentBiospecimenID = 'HTANParentBiospecimenID',
    HTANParentDataFileID = 'HTANParentDataFileID',
}

export const HTANToGenericAttributeMap: {
    [attr in HTANAttributeNames]: GenericAttributeNames;
} = {
    [HTANAttributeNames.HTANParentID]: GenericAttributeNames.ParentID,
    [HTANAttributeNames.HTANBiospecimenID]: GenericAttributeNames.BiospecimenID,
    [HTANAttributeNames.HTANDataFileID]: GenericAttributeNames.DataFileID,
    [HTANAttributeNames.HTANParticipantID]: GenericAttributeNames.ParticipantID,
    [HTANAttributeNames.HTANParentBiospecimenID]:
        GenericAttributeNames.ParentBiospecimenID,
    [HTANAttributeNames.HTANParentDataFileID]:
        GenericAttributeNames.ParentDataFileID,
};

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
    // idc = 'IDC',
    cds = 'CDS/SB-CGC (open access)',
    synapse = 'Synapse',
    comingSoon = 'Coming Soon',
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
