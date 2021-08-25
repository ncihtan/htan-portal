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
            return _.sortBy(ret, (o) => o.label);
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
            AttributeNames.assayName,
            AttributeNames.Level,
            AttributeNames.FileFormat,
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
                            classNamePrefix={'react-select'}
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
                    <div style={{ width: 120 }}>
                        <FilterPanel
                            placeholder={
                                AttributeMap[AttributeNames.AtlasName]
                                    .displayName
                            }
                        >
                            <FilterPropertyColumnShell
                                title={
                                    AttributeMap[AttributeNames.AtlasName]
                                        .displayName
                                }
                            >
                                <FilterCheckList
                                    setFilter={props.setFilter}
                                    filters={props.selectedFiltersByGroupName}
                                    options={options(AttributeNames.AtlasName)}
                                />
                            </FilterPropertyColumnShell>
                        </FilterPanel>
                    </div>
                </div>

                <div>
                    <div style={{ width: 120 }}>
                        <FilterPanel
                            placeholder={
                                AttributeMap[
                                    AttributeNames.TissueorOrganofOrigin
                                ].displayName
                            }
                        >
                            <FilterPropertyColumnShell
                                title={
                                    AttributeMap[
                                        AttributeNames.TissueorOrganofOrigin
                                    ].displayName
                                }
                            >
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
                    <div style={{ width: 164 }}>
                        <FilterPanel
                            placeholder={
                                AttributeMap[AttributeNames.PrimaryDiagnosis]
                                    .displayName
                            }
                        >
                            <div className={'filter-checkbox-list-container'}>
                                <FilterPropertyColumnShell
                                    title={
                                        AttributeMap[
                                            AttributeNames.PrimaryDiagnosis
                                        ].displayName
                                    }
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
                                {/*<FilterPropertyColumnShell title={'Stage'}>*/}
                                {/*    <FilterCheckList*/}
                                {/*        setFilter={props.setFilter}*/}
                                {/*        filters={*/}
                                {/*            props.selectedFiltersByGroupName*/}
                                {/*        }*/}
                                {/*        options={sortStageOptions(*/}
                                {/*            options(AttributeNames.Stage)*/}
                                {/*        )}*/}
                                {/*    />*/}
                                {/*</FilterPropertyColumnShell>*/}
                            </div>
                        </FilterPanel>
                    </div>
                </div>

                <div>
                    <div style={{ width: 164 }}>
                        <FilterPanel
                            placeholder={'Demographics'}
                        >
                            <div className={'filter-checkbox-list-container'}>
                                <FilterPropertyColumnShell
                                    title={
                                        AttributeMap[
                                            AttributeNames.Gender
                                        ].displayName
                                    }
                                >
                                    <FilterCheckList
                                        setFilter={props.setFilter}
                                        filters={
                                            props.selectedFiltersByGroupName
                                        }
                                        options={options(
                                            AttributeNames.Gender
                                        )}
                                    />
                                </FilterPropertyColumnShell>
                                <FilterPropertyColumnShell
                                    title={
                                        AttributeMap[
                                            AttributeNames.Race
                                        ].displayName
                                    }
                                >
                                    <FilterCheckList
                                        setFilter={props.setFilter}
                                        filters={
                                            props.selectedFiltersByGroupName
                                        }
                                        options={options(
                                            AttributeNames.Race
                                        )}
                                    />
                                </FilterPropertyColumnShell>
                                <FilterPropertyColumnShell
                                    title={
                                        AttributeMap[
                                            AttributeNames.Ethnicity
                                        ].displayName
                                    }
                                >
                                    <FilterCheckList
                                        setFilter={props.setFilter}
                                        filters={
                                            props.selectedFiltersByGroupName
                                        }
                                        options={options(
                                            AttributeNames.Ethnicity
                                        )}
                                    />
                                </FilterPropertyColumnShell>
                            </div>
                        </FilterPanel>
                    </div>
                </div>

                <div>
                    <div style={{ width: 151 }}>
                        <FilterPanel placeholder={'Assay Type'}>
                            <FilterPropertyColumnShell title={'Assay Type'}>
                                <FilterCheckList
                                    setFilter={props.setFilter}
                                    filters={props.selectedFiltersByGroupName}
                                    options={options(AttributeNames.assayName)}
                                />
                            </FilterPropertyColumnShell>
                        </FilterPanel>
                    </div>
                </div>

                <div>
                    <div style={{ width: 137 }}>
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
