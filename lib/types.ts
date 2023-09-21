import { Tool } from './tools';
import { Atlas, Entity } from '../packages/data-portal-commons/src/libs/entity';
import { getDelimitedValues } from '../packages/data-portal-utils/src/libs/getDelimitedValues';
import { AttributeMap } from '../packages/data-portal-utils/src/libs/types';
import { DataSchemaData } from '../packages/data-portal-schema/src/libs/dataSchemaHelpers';

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

export const ToolAttributeMap: AttributeMap<Tool, ToolAttributeNames> = {
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
