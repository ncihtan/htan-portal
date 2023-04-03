import React from 'react';
import {
    getOptions,
    getSelectOptions,
    IFilterControlsProps,
} from '../../lib/filterHelpers';
import { observer } from 'mobx-react';
import { ToolAttributeMap, ToolAttributeNames } from '../../lib/types';
import FilterSearch from './FilterSearch';
import { Tool } from '../../lib/tools';
import FilterDropdown from './FilterDropdown';

const ToolFilterControls: React.FunctionComponent<
    IFilterControlsProps<Tool>
> = observer((props) => {
    const options = getOptions(
        ToolAttributeMap,
        props.selectedFiltersByGroupName,
        props.selectedFilters,
        props.entities,
        props.groupsByProperty
    );
    const selectOptions = getSelectOptions(
        ToolAttributeMap,
        [
            ToolAttributeNames.AtlasName,
            ToolAttributeNames.ToolType,
            ToolAttributeNames.ToolLanguage,
            ToolAttributeNames.ToolTopic,
            ToolAttributeNames.ToolAssay,
        ],
        options
    );
    const dropdownProps = {
        options,
        countHeader: 'Tools',
        setFilter: props.setFilter,
        selectedFiltersByGroupName: props.selectedFiltersByGroupName,
        attributeMap: ToolAttributeMap,
    };

    return (
        <div className="filterControls">
            <FilterSearch
                selectOptions={selectOptions}
                setFilter={props.setFilter}
            />

            <FilterDropdown
                {...dropdownProps}
                attributes={[ToolAttributeNames.AtlasName]}
            />
            <FilterDropdown
                {...dropdownProps}
                attributes={[ToolAttributeNames.ToolType]}
            />
            <FilterDropdown
                {...dropdownProps}
                width={120}
                attributes={[ToolAttributeNames.ToolLanguage]}
            />
            <FilterDropdown
                {...dropdownProps}
                attributes={[ToolAttributeNames.ToolTopic]}
            />
            <FilterDropdown
                {...dropdownProps}
                attributes={[ToolAttributeNames.ToolAssay]}
            />
        </div>
    );
});

export default ToolFilterControls;
