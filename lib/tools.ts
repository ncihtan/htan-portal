import toolsJson from '../data/tools.json';
import _ from 'lodash';

export interface Tool {
    'Atlas Name': string;
    'Grant ID': string;
    'Tool ID': string;
    'Parent ID': string;
    'Tool Publication': string;
    Perspective: 'TRUE' | 'FALSE' | '';
    'Tool Name': string;
    'Tool Alias': string;
    'Tool Type': string;
    'Tool Language': string;
    'Tool Homepage': string;
    'Tool Description': string;
    'Tool Topic': string;
    'Tool Operation': string;
    'Tool Input Data': string;
    'Tool Output Data': string;
}

export interface Tools {
    headerIds: Tool;
    headerDescriptions: Tool;
    data: Tool[];
}

export function getToolData(tools: Tool[] = toolsJson as Tool[]): Tools {
    // first two rows is metadata, the rest is data
    return {
        headerIds: tools[0],
        headerDescriptions: tools[1],
        data: tools
            .filter((t) => !_.isEmpty(t['Tool Name']) && t['Tool Name'] !== '?')
            .slice(2),
    };
}
