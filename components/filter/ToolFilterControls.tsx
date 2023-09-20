import React from 'react';
import { observer } from 'mobx-react';
import { ToolAttributeMap, ToolAttributeNames } from '../../lib/types';
import { Tool } from '../../lib/tools';
import {
    getDropdownOptionsFromProps,
    getOptionsFromProps,
} from '../../packages/data-portal-filter/src/libs/helpers';
import FilterControls from '../../packages/data-portal-filter/src/components/FilterControls';
import FilterDropdown from '../../packages/data-portal-filter/src/components/FilterDropdown';
import { IFilterControlsProps } from '../../packages/data-portal-filter/src/libs/types';

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
