import { Tool } from './tools';
import { Atlas } from '@htan/data-portal-commons';
import { AttributeMap, getDelimitedValues } from '@htan/data-portal-utils';

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
