import { observer } from 'mobx-react';
import React from 'react';
import _ from 'lodash';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimesCircle } from '@fortawesome/free-solid-svg-icons';

import {
    FilterActionMeta,
    SelectedFilter,
    FilterAction,
    ISelectedFiltersByAttrName,
} from '../lib/types';

import styles from './filter.module.scss';

interface IFilterProps {
    setFilter: (actionMeta: FilterActionMeta<SelectedFilter>) => void;
    selectedFiltersByGroupName: ISelectedFiltersByAttrName;
    getFilterDisplayName: (filter: string) => string;
}

export const Filter: React.FunctionComponent<IFilterProps> = observer(
    (props) => {
        if (_.size(props.selectedFiltersByGroupName) === 0) {
            return <></>;
        }

        return (
            <div className={styles.filter}>
                {Object.keys(props.selectedFiltersByGroupName).map(
                    (filter, i, filters) => {
                        const numberOfAttributes = filters.length;
                        const addAnd =
                            numberOfAttributes > 1 &&
                            i < numberOfAttributes - 1 ? (
                                <span className={styles.logicalAnd}>AND</span>
                            ) : null;

                        return (
                            <>
                                <span className={styles.attributeGroup}>
                                    <span
                                        className={styles.attributeGroupName}
                                        onClick={() => {
                                            props.setFilter({
                                                action: FilterAction.CLEAR,
                                                option: {
                                                    group: filter,
                                                    value: '',
                                                },
                                            });
                                        }}
                                    >
                                        {props.getFilterDisplayName(filter)}
                                    </span>

                                    {[
                                        ...props.selectedFiltersByGroupName[
                                            filter
                                        ].values(),
                                    ].map((value, i, values) => {
                                        const numberOfValues = values.length;
                                        const openParenthesis =
                                            numberOfValues > 1 && i == 0 ? (
                                                <span
                                                    className={
                                                        styles.logicalParentheses
                                                    }
                                                >
                                                    (
                                                </span>
                                            ) : null;
                                        const addOr =
                                            numberOfValues > 1 &&
                                            i < numberOfValues - 1 ? (
                                                <span
                                                    className={styles.logicalOr}
                                                >
                                                    OR
                                                </span>
                                            ) : null;
                                        const closeParenthesis =
                                            numberOfValues > 1 &&
                                            i == numberOfValues - 1 ? (
                                                <span
                                                    className={
                                                        styles.logicalParentheses
                                                    }
                                                >
                                                    )
                                                </span>
                                            ) : null;

                                        return (
                                            <span
                                                className={
                                                    styles.attributeValues
                                                }
                                            >
                                                {openParenthesis}
                                                <span
                                                    className={
                                                        styles.attributeValue
                                                    }
                                                    onClick={() => {
                                                        props.setFilter({
                                                            action:
                                                                FilterAction.DESELECT,
                                                            option: {
                                                                value,
                                                                group: filter,
                                                            },
                                                        });
                                                    }}
                                                >
                                                    {value}
                                                </span>
                                                {addOr}
                                                {closeParenthesis}
                                            </span>
                                        );
                                    })}
                                </span>
                                {addAnd}
                            </>
                        );
                    }
                )}
                {!_.isEmpty(props.selectedFiltersByGroupName) && (
                    <span className={styles.clearFilterButton}>
                        <span
                            onClick={() => {
                                props.setFilter({
                                    action: FilterAction.CLEAR_ALL,
                                });
                            }}
                        >
                            <FontAwesomeIcon icon={faTimesCircle} /> Clear all
                            filters
                        </span>
                    </span>
                )}
            </div>
        );
    }
);

export default Filter;
