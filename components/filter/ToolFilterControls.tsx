import React from 'react';
import { observer } from 'mobx-react';
import { ToolAttributeMap, ToolAttributeNames } from '../../lib/types';
import { Tool } from '../../lib/tools';
import {
    FilterControls,
    FilterDropdown,
    getDropdownOptionsFromProps,
    getOptionsFromProps,
    IFilterControlsProps,
} from '@htan/data-portal-filter';

const ToolFilterControls: React.FunctionComponent<
    IFilterControlsProps<Tool, ToolAttributeNames>
> = observer((props) => {
    const filterControlsProps = {
        ...props,
        countHeader: 'Tools',
        attributeMap: ToolAttributeMap,
        attributeNames: [
            ToolAttributeNames.AtlasName,
            ToolAttributeNames.ToolType,
            ToolAttributeNames.ToolLanguage,
            ToolAttributeNames.ToolTopic,
            ToolAttributeNames.ToolAssay,
        ],
    };

    const options = getOptionsFromProps(filterControlsProps);
    const dropdownProps = getDropdownOptionsFromProps(
        filterControlsProps,
        options
    );

    return (
        <FilterControls {...filterControlsProps}>
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
            {/*<FilterDropdown
                {...dropdownProps}
                attributes={[ToolAttributeNames.ToolTopic]}
            />*/}
            <FilterDropdown
                {...dropdownProps}
                attributes={[ToolAttributeNames.ToolAssay]}
            />
        </FilterControls>
    );
});

export default ToolFilterControls;
