import { ToolAttributeMap, ToolAttributeNames } from './types';
import { Tool } from './tools';

import {
    filterEntities,
    groupEntitiesByAttrNameAndValue,
    ISelectedFiltersByAttrName,
} from '@htan/data-portal-filter';

export function getToolFilterDisplayName(filter: string) {
    return ToolAttributeMap[
        ToolAttributeNames[filter as keyof typeof ToolAttributeNames]
    ].displayName;
}

export function groupToolsByAttrNameAndValue(tools: Tool[]) {
    return groupEntitiesByAttrNameAndValue(tools, ToolAttributeMap);
}

export function filtertools(
    filterSelectionsByAttrName: ISelectedFiltersByAttrName,
    tools: Tool[]
) {
    return filterEntities(ToolAttributeMap, filterSelectionsByAttrName, tools);
}
