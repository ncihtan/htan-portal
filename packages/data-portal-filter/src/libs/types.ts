import { ActionMeta, ActionTypes, OptionTypeBase } from 'react-select';

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
