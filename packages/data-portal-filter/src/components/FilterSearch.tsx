import Select from 'react-select';
import _ from 'lodash';
import React from 'react';
import { action } from 'mobx';
import { FilterActionMeta, OptionType, SelectedFilter } from '../libs/types';

interface IFilterSearchProps {
    setFilter: (actionMeta: any) => void;
    selectOptions: { label: string; options: OptionType[] }[];
}

const FilterSearch: React.FunctionComponent<IFilterSearchProps> = (props) => {
    const handleChange = action(
        (value: any, actionMeta: FilterActionMeta<SelectedFilter>) => {
            props.setFilter(actionMeta);
        }
    );

    return (
        <div>
            <div style={{ width: 220 }}>
                <Select
                    isSearchable
                    classNamePrefix={'react-select'}
                    isClearable={false}
                    name="searchAll"
                    placeholder="Search all filters"
                    controlShouldRenderValue={false}
                    isMulti={true}
                    options={props.selectOptions}
                    hideSelectedOptions={false}
                    closeMenuOnSelect={false}
                    onChange={handleChange}
                    value={_.flatMap(
                        props.selectOptions,
                        (obj) => obj.options
                    ).filter((o) => o.isSelected)}
                />
            </div>
        </div>
    );
};

export default FilterSearch;
