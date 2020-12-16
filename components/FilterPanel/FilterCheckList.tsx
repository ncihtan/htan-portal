import React, { ChangeEvent, FunctionComponent, useCallback } from 'react';
import { ActionMeta } from 'react-select';
import { ExploreOptionType, PropNames } from '../../lib/types';

interface IFilterCheckList {
    setFilter: (
        groupNames: string[],
        actionMeta: ActionMeta<ExploreOptionType>
    ) => void;
    options: ExploreOptionType[];
}

const FilterCheckList: FunctionComponent<IFilterCheckList> = function (props) {
    return (
        <div>
            {props.options.map((option) => {
                const id = `cb-${option.group}-${option.value}`;
                return (
                    <div className="form-check">
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
};

export default FilterCheckList;
