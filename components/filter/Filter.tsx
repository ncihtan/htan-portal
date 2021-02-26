import {observer} from "mobx-react";
import React from "react";
import _ from "lodash";

import {
    ExploreActionMeta,
    ExploreSelectedFilter,
    FilterAction,
    IFiltersByGroupName,
    PropMap,
    PropNames
} from "../../lib/types";

interface IFilterProps {
    setFilter: (actionMeta: ExploreActionMeta<ExploreSelectedFilter>) => void;
    selectedFiltersByGroupName: IFiltersByGroupName;
}

const Filter: React.FunctionComponent<IFilterProps> = observer(props => {
    return (
        <div className={'filter'}>
            {Object.keys(props.selectedFiltersByGroupName).map(
                (filter, i, filters) => {
                    const numberOfAttributes = filters.length;
                    const addAnd =
                        numberOfAttributes > 1 &&
                        i < numberOfAttributes - 1 ? (
                            <span className="logicalAnd">
                                AND
                            </span>
                        ) : null;

                    return (
                        <span className="attributeGroup">
                            <span
                                className="attributeGroupName"
                                onClick={() => {
                                    props.setFilter({
                                        action: FilterAction.CLEAR,
                                        option: {
                                            group: filter,
                                            value: ''
                                        }
                                    });
                                }}
                            >
                                {
                                    PropMap[
                                        PropNames[
                                            filter as keyof typeof PropNames
                                            ]
                                        ].displayName
                                }
                            </span>

                            {props.selectedFiltersByGroupName[filter].map(
                                (value, i, values) => {
                                    const numberOfValues =
                                        values.length;
                                    const openParenthesis =
                                        numberOfValues > 1 &&
                                        i == 0 ? (
                                            <span className="logicalParentheses">
                                                (
                                            </span>
                                        ) : null;
                                    const addOr =
                                        numberOfValues > 1 &&
                                        i <
                                        numberOfValues -
                                        1 ? (
                                            <span className="logicalOr">
                                                OR
                                            </span>
                                        ) : null;
                                    const closeParenthesis =
                                        numberOfValues > 1 &&
                                        i ==
                                        numberOfValues -
                                        1 ? (
                                            <span className="logicalParentheses">
                                                )
                                            </span>
                                        ) : null;

                                    return (
                                        <span className="attributeValues">
                                            {openParenthesis}
                                            <span
                                                className="attributeValue"
                                                onClick={() => {
                                                    props.setFilter(
                                                        {
                                                            action:
                                                                FilterAction.DESELECT,
                                                            option: {
                                                                value:value.value,
                                                                group: filter,
                                                            },
                                                        }
                                                    );
                                                }}
                                            >
                                                {value.value}
                                            </span>
                                            {addOr}
                                            {closeParenthesis}
                                        </span>
                                    );
                                }
                            )}
                            {addAnd}
                        </span>
                    );
                }
            )}
            {!_.isEmpty(props.selectedFiltersByGroupName) && (
                <div
                    className={"btn btn-sm btn-secondary"}
                    onClick={() => {
                        props.setFilter({
                            action: FilterAction.CLEAR_ALL,
                        });
                    }}
                >
                    Clear all filters
                </div>
            )}
        </div>
    );
});

export default Filter;
