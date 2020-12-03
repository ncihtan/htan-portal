import React, { ChangeEvent, FunctionComponent, useCallback } from 'react';
import { ActionMeta } from 'react-select';
import {
    ExploreOptionType,
    IFiltersByGroupName,
    PropNames,
} from '../../lib/types';
import { observer } from 'mobx-react';
import _ from 'lodash';

interface IFilterCheckList {
    setFilter: (
        groupNames: string[],
        actionMeta: ActionMeta<ExploreOptionType>
    ) => void;
    filters: IFiltersByGroupName;
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
                    _.some(
                        props.filters[option.group],
                        (o) => o.value === option.value
                    );
                return (
                    <div className="form-check" key={id}>
                        <input
                            className="form-check-input"
                            onChange={(e) => {
                                props.setFilter([PropNames.PrimaryDiagnosis], {
                                    option,
                                    action: e.currentTarget.checked
                                        ? 'select-option'
                                        : 'deselect-option',
                                });
                            }}
                            checked={checked}
                            disabled={disabled}
                            type="checkbox"
                            id={id}
                        />
                        <label className="form-check-label" htmlFor={id}>
                            {option.label}
                        </label>
                    </div>
                );
            })}
        </div>
    );
});

export default FilterCheckList;
