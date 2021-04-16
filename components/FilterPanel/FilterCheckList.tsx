import React, { FunctionComponent, useEffect } from 'react';
import classNames from 'classnames';
import { ActionMeta } from 'react-select';
import { ExploreOptionType, ISelectedFiltersByAttrName } from '../../lib/types';
import { observer } from 'mobx-react';
import styles from './styles.module.scss';

interface IFilterCheckList {
    setFilter: (actionMeta: ActionMeta<ExploreOptionType>) => void;
    filters: ISelectedFiltersByAttrName;
    options: ExploreOptionType[];
}

const FilterCheckList: FunctionComponent<IFilterCheckList> = observer(function (
    props
) {
    return (
        <div>
            {props.options.map((option) => {
                const id = `cb-${option.group}-${option.value}`;
                const disabled = option.count === 0;
                const checked =
                    option.group in props.filters &&
                    props.filters[option.group].has(option.value);
                return (
                    <div
                        className={classNames('form-check', styles.formCheck)}
                        key={id}
                    >
                        <input
                            className={classNames(
                                'form-check-input',
                                styles.checkboxLabel
                            )}
                            onChange={(e) => {
                                const val = e.currentTarget.checked;
                                setTimeout(() => {
                                    props.setFilter({
                                        option,
                                        action: val
                                            ? 'select-option'
                                            : 'deselect-option',
                                    });
                                }, 100);
                            }}
                            defaultChecked={checked}
                            disabled={disabled}
                            type="checkbox"
                            id={id}
                        />
                        <label
                            className={classNames(
                                'form-check-label',
                                styles.checkboxLabel
                            )}
                            htmlFor={id}
                        >
                            {option.label}
                        </label>
                        <div className={styles.fileCount}>{option.count}</div>
                    </div>
                );
            })}
        </div>
    );
});

export default FilterCheckList;
