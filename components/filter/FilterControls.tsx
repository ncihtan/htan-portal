import _ from 'lodash';
import { action } from 'mobx';
import { observer } from 'mobx-react';
import React from 'react';
import Select, { ActionMeta } from 'react-select';

import { makeOptions } from '../../lib/filterHelpers';
import {
    Entity,
    sortStageOptions,
    updateSelectedFiltersInURL,
} from '../../lib/helpers';
import {
    ExploreActionMeta,
    ExploreOptionType,
    ExploreSelectedFilter,
    AttributeMap,
    AttributeNames,
    ISelectedFiltersByAttrName,
} from '../../lib/types';
import FilterCheckList from '../FilterPanel/FilterCheckList';
import FilterPanel from '../FilterPanel/FilterPanel';
import FilterPropertyColumnShell from '../FilterPanel/FilterPropertyColumn';

interface IFilterControlsProps {
    setFilter: (actionMeta: any) => void;
    selectedFiltersByGroupName: ISelectedFiltersByAttrName;
    selectedFilters: ExploreSelectedFilter[];
    files: Entity[];
    getGroupsByProperty: any;
}

const FilterControls: React.FunctionComponent<IFilterControlsProps> = observer(
    (props) => {
        const options = (attrName: AttributeNames): ExploreOptionType[] => {
            const ret = makeOptions(
                attrName,
                props.selectedFiltersByGroupName,
                props.files,
                props.getGroupsByProperty
            );
            ret.forEach((opt) => {
                opt.group = attrName;
                opt.isSelected = isOptionSelected(opt); // this call has to happen after setting `group`
            });
            return ret;
        };

        const isOptionSelected = (option: ExploreSelectedFilter) => {
            return (
                _.find(props.selectedFilters, (o: ExploreSelectedFilter) => {
                    return o.value === option.value && option.group === o.group;
                }) !== undefined
            );
        };

        const handleChange = action(
            (
                value: any,
                actionMeta: ExploreActionMeta<ExploreSelectedFilter>
            ) => {
                props.setFilter(actionMeta);
            }
        );

        const selectOptions = [
            AttributeNames.AtlasName,
            AttributeNames.TissueorOrganofOrigin,
            AttributeNames.PrimaryDiagnosis,
            AttributeNames.Component,
            AttributeNames.Stage,
        ].map((attrName) => {
            return {
                label: AttributeMap[attrName].displayName,
                options: options(attrName),
            };
        });

        return (
            <div className="filterControls">
                <div>
                    <div style={{ width: 220 }}>
                        <Select
                            isSearchable
                            isClearable={false}
                            name="searchAll"
                            placeholder="Search all filters"
                            controlShouldRenderValue={false}
                            isMulti={true}
                            options={selectOptions}
                            hideSelectedOptions={false}
                            closeMenuOnSelect={false}
                            onChange={handleChange}
                            value={_.flatMap(
                                selectOptions,
                                (obj) => obj.options
                            ).filter((o) => o.isSelected)}
                        />
                    </div>
                </div>

                <div>
                    <div style={{ width: 220 }}>
                        <FilterPanel placeholder={'Cancer Type'}>
                            <div className={'filter-checkbox-list-container'}>
                                <FilterPropertyColumnShell
                                    title={'Cancer Type'}
                                >
                                    <FilterCheckList
                                        setFilter={props.setFilter}
                                        filters={
                                            props.selectedFiltersByGroupName
                                        }
                                        options={options(
                                            AttributeNames.PrimaryDiagnosis
                                        )}
                                    />
                                </FilterPropertyColumnShell>
                                <FilterPropertyColumnShell title={'Stage'}>
                                    <FilterCheckList
                                        setFilter={props.setFilter}
                                        filters={
                                            props.selectedFiltersByGroupName
                                        }
                                        options={sortStageOptions(
                                            options(AttributeNames.Stage)
                                        )}
                                    />
                                </FilterPropertyColumnShell>
                            </div>
                        </FilterPanel>
                    </div>
                </div>

                <div>
                    <div style={{ width: 220 }}>
                        <FilterPanel placeholder={'Tissue Type'}>
                            <FilterPropertyColumnShell title={'Tissue Type'}>
                                <FilterCheckList
                                    setFilter={props.setFilter}
                                    filters={props.selectedFiltersByGroupName}
                                    options={options(
                                        AttributeNames.TissueorOrganofOrigin
                                    )}
                                />
                            </FilterPropertyColumnShell>
                        </FilterPanel>
                    </div>
                </div>

                <div>
                    <div style={{ width: 220 }}>
                        <FilterPanel placeholder={'Assay Type'}>
                            <FilterPropertyColumnShell title={'Assay Type'}>
                                <FilterCheckList
                                    setFilter={props.setFilter}
                                    filters={props.selectedFiltersByGroupName}
                                    options={options(AttributeNames.Component)}
                                />
                            </FilterPropertyColumnShell>
                        </FilterPanel>
                    </div>
                </div>

                <div>
                    <div style={{ width: 220 }}>
                        <FilterPanel placeholder={'File Type'}>
                            <div className={'filter-checkbox-list-container'}>
                                <FilterPropertyColumnShell title={'Level'}>
                                    <FilterCheckList
                                        setFilter={props.setFilter}
                                        filters={
                                            props.selectedFiltersByGroupName
                                        }
                                        options={options(AttributeNames.Level)}
                                    ></FilterCheckList>
                                </FilterPropertyColumnShell>
                                <FilterPropertyColumnShell
                                    title={'File Format'}
                                >
                                    <FilterCheckList
                                        setFilter={props.setFilter}
                                        filters={
                                            props.selectedFiltersByGroupName
                                        }
                                        options={options(
                                            AttributeNames.FileFormat
                                        )}
                                    ></FilterCheckList>
                                </FilterPropertyColumnShell>
                            </div>
                        </FilterPanel>
                    </div>
                </div>
            </div>
        );
    }
);

export default FilterControls;
