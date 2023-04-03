import React from 'react';
import FilterPanel from '../FilterPanel/FilterPanel';
import FilterPropertyColumnShell from '../FilterPanel/FilterPropertyColumn';
import FilterCheckList from '../FilterPanel/FilterCheckList';
import {
    ExploreOptionType,
    IAttributeInfo,
    ISelectedFiltersByAttrName,
} from '../../lib/types';

interface IFilterDropdownProps<Attribute extends string, T> {
    attributes: Attribute[];
    attributeMap: { [attr in Attribute]: IAttributeInfo<T> };
    options: (attrName: Attribute) => ExploreOptionType[];
    setFilter: (actionMeta: any) => void;
    selectedFiltersByGroupName: ISelectedFiltersByAttrName;
    countHeader: string;
    placeholder?: string;
    width?: number;
    className?: string;
}

const FilterDropdown = <Attribute extends string, T>(
    props: IFilterDropdownProps<Attribute, T>
) => {
    const width = props.width || 100;
    const placeholder =
        props.placeholder ||
        props.attributeMap[props.attributes[0]].displayName;

    return (
        <div>
            <div style={{ width }}>
                <FilterPanel placeholder={placeholder}>
                    <div className={props.className}>
                        {props.attributes.map((attribute) => {
                            const displayName =
                                props.attributeMap[attribute].displayName;
                            return (
                                <FilterPropertyColumnShell
                                    title={displayName}
                                    countHeader={props.countHeader}
                                    key={displayName}
                                >
                                    <FilterCheckList
                                        setFilter={props.setFilter}
                                        filters={
                                            props.selectedFiltersByGroupName
                                        }
                                        options={props.options(attribute)}
                                    />
                                </FilterPropertyColumnShell>
                            );
                        })}
                    </div>
                </FilterPanel>
            </div>
        </div>
    );
};

export default FilterDropdown;
