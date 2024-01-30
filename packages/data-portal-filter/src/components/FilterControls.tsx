import React from 'react';
import { observer } from 'mobx-react';
import { getOptionsFromProps, getSelectOptionsFromProps } from '../lib/helpers';
import { IGenericFilterControlProps } from '../lib/types';
import FilterSearch from './FilterSearch';

import styles from './filterControls.module.scss';

export const FilterControls = observer(
    <T, Attribute extends string>(
        props: React.PropsWithChildren<IGenericFilterControlProps<T, Attribute>>
    ) => {
        const options = getOptionsFromProps(props);
        const selectOptions = getSelectOptionsFromProps(props, options);

        return (
            <div className={styles.filterControls}>
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
