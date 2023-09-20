import { ActionMeta, ActionTypes, OptionTypeBase } from 'react-select';
import { AttributeMap } from '../../../data-portal-utils/src/libs/types';

export type OptionType = {
    value: string;
    label: string | JSX.Element;
    group: string;
    count?: number;
    isSelected?: boolean;
};

export type SelectedFilter = {
    group: string;
    value: string;
    id?: string;
};

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

export interface FilterActionMeta<OptionType extends OptionTypeBase>
    extends Omit<ActionMeta<OptionType>, 'action'> {
    action: ActionTypes | FilterAction;
}

export interface IFilterControlsProps<T, Attribute extends string> {
    setFilter: (actionMeta: any) => void;
    selectedFiltersByGroupName: ISelectedFiltersByAttrName;
    selectedFilters: SelectedFilter[];
    entities: T[];
    groupsByProperty: { [attrName: string]: { [attrValue: string]: T[] } };
}

export interface IGenericFilterControlProps<T, Attribute extends string>
    extends IFilterControlsProps<T, Attribute> {
    countHeader: string;
    attributeMap: AttributeMap<T, Attribute>;
    attributeNames: Attribute[];
}
