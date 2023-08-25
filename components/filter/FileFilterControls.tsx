import { observer } from 'mobx-react';
import React from 'react';

import {
    getOptions,
    getSelectOptions,
    IFilterControlsProps,
} from '../../lib/filterHelpers';
import { Entity, isReleaseQCEnabled } from '../../lib/helpers';
import {
    AttributeNames,
    DownloadSourceCategory,
    ExploreOptionType,
    FileAttributeMap,
} from '../../lib/types';
import FilterSearch from './FilterSearch';
import FilterDropdown from './FilterDropdown';

const FileFilterControls: React.FunctionComponent<
    IFilterControlsProps<Entity>
> = observer((props) => {
    const options = getOptions(
        FileAttributeMap,
        props.selectedFiltersByGroupName,
        props.selectedFilters,
        props.entities,
        props.groupsByProperty
    );
    const selectOptions = getSelectOptions(
        FileAttributeMap,
        [
            AttributeNames.AtlasName,
            AttributeNames.TissueorOrganofOrigin,
            AttributeNames.PrimaryDiagnosis,
            AttributeNames.assayName,
            AttributeNames.Level,
            AttributeNames.FileFormat,
        ],
        options
    );
    const dropdownProps = {
        options,
        countHeader: 'Files',
        setFilter: props.setFilter,
        selectedFiltersByGroupName: props.selectedFiltersByGroupName,
        attributeMap: FileAttributeMap,
    };

    return (
        <div className="filterControls">
            <FilterSearch
                selectOptions={selectOptions}
                setFilter={props.setFilter}
            />

            <FilterDropdown
                {...dropdownProps}
                attributes={[AttributeNames.AtlasName]}
            />
            <FilterDropdown
                {...dropdownProps}
                attributes={[AttributeNames.TissueorOrganofOrigin]}
            />
            <FilterDropdown
                {...dropdownProps}
                attributes={[
                    AttributeNames.PrimaryDiagnosis /*AttributeNames.Stage*/,
                ]}
                className="filter-checkbox-list-container"
                width={120}
            />
            <FilterDropdown
                {...dropdownProps}
                placeholder="Demographics"
                attributes={[
                    AttributeNames.Gender,
                    AttributeNames.Race,
                    AttributeNames.Ethnicity,
                ]}
                className="filter-checkbox-list-container"
                width={164}
            />
            <FilterDropdown
                {...dropdownProps}
                attributes={[AttributeNames.assayName]}
            />
            <FilterDropdown
                {...dropdownProps}
                placeholder="File"
                attributes={[AttributeNames.Level, AttributeNames.FileFormat]}
                className="filter-checkbox-list-container"
                width={80}
            />
            <FilterDropdown
                {...dropdownProps}
                attributes={[AttributeNames.downloadSource]}
                width={170}
                options={(attrName: AttributeNames) => {
                    return options(attrName)
                        .sort((a: ExploreOptionType, b: ExploreOptionType) => {
                            const downloadSourceOrder = [
                                DownloadSourceCategory.dbgap,
                                DownloadSourceCategory.idcDbgap,
                                DownloadSourceCategory.idc,
                                DownloadSourceCategory.synapse,
                                DownloadSourceCategory.comingSoon,
                            ];
                            return (
                                downloadSourceOrder.indexOf(
                                    a.label as DownloadSourceCategory
                                ) -
                                downloadSourceOrder.indexOf(
                                    b.label as DownloadSourceCategory
                                )
                            );
                        })
                        .map((e: ExploreOptionType) => {
                            const downloadLabels = {
                                [DownloadSourceCategory.dbgap]:
                                    'CDS/SB-CGC (dbGaP 🔒)',
                                [DownloadSourceCategory.idc]: 'IDC (Imaging)',
                                [DownloadSourceCategory.idcDbgap]:
                                    'CDS/SB-CGC and IDC',
                                [DownloadSourceCategory.synapse]:
                                    'Synapse (Level 3-4)',
                                [DownloadSourceCategory.comingSoon]:
                                    'Coming Soon',
                            };

                            e.label =
                                downloadLabels[
                                    e.label as DownloadSourceCategory
                                ];
                            return e;
                        });
                }}
            />
            {isReleaseQCEnabled() && (
                <FilterDropdown
                    {...dropdownProps}
                    attributes={[AttributeNames.releaseVersion]}
                    width={120}
                />
            )}
        </div>
    );
});

export default FileFilterControls;
