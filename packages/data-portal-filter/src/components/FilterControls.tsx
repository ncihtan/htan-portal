import React from 'react';
import { observer } from 'mobx-react';
import {
    getOptionsFromProps,
    getSelectOptionsFromProps,
} from '../libs/helpers';
import { IGenericFilterControlProps } from '../libs/types';
import FilterSearch from './FilterSearch';

const FilterControls = observer(
    <T, Attribute extends string>(
        props: React.PropsWithChildren<IGenericFilterControlProps<T, Attribute>>
    ) => {
        const options = getOptionsFromProps(props);
        const selectOptions = getSelectOptionsFromProps(props, options);

        return (
            <div className="filterControls">
                <FilterSearch
                    selectOptions={selectOptions}
                    setFilter={props.setFilter}
                />
                {props.children}
            </div>
        );
    }
);

export default FilterControls;
