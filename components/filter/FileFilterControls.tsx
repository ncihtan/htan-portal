import { observer } from 'mobx-react';
import React from 'react';

import { IFilterControlsProps } from '../../lib/filterHelpers';
import { Entity, isReleaseQCEnabled } from '../../lib/helpers';
import { DownloadSourceCategory, FileAttributeMap } from '../../lib/types';

import {
    getOptions,
    getSelectOptions,
} from '../../packages/data-portal-filter/src/libs/helpers';
import FilterSearch from '../../packages/data-portal-filter/src/components/FilterSearch';
import FilterDropdown from '../../packages/data-portal-filter/src/components/FilterDropdown';
import { OptionType } from '../../packages/data-portal-filter/src/libs/types';
import { AttributeNames } from '../../packages/data-portal-utils/src/libs/types';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faLockOpen } from '@fortawesome/free-solid-svg-icons';

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
                className="filter-checkbox-list-container"
                width={170}
                options={(attrName: AttributeNames) => {
                    return options(attrName)
                        .sort((a: OptionType, b: OptionType) => {
                            const downloadSourceOrder = [
                                DownloadSourceCategory.dbgap,
                                DownloadSourceCategory.cds,
                                // DownloadSourceCategory.idc,
                                DownloadSourceCategory.synapse,
                                DownloadSourceCategory.comingSoon,
                            ];
                            return (
                                downloadSourceOrder.indexOf(
                                    a.value as DownloadSourceCategory
                                ) -
                                downloadSourceOrder.indexOf(
                                    b.value as DownloadSourceCategory
                                )
                            );
                        })
                        .map((e: OptionType) => {
                            const downloadLabels = {
                                [DownloadSourceCategory.dbgap]:
                                    'CDS/SB-CGC (dbGaP 🔒)',
                                // [DownloadSourceCategory.idc]: 'IDC (Imaging)',
                                [DownloadSourceCategory.cds]: (
                                    <span>
                                        CDS/SB-CGC (Open Access{' '}
                                        <FontAwesomeIcon
                                            color="#1adb54"
                                            icon={faLockOpen}
                                        />
                                        )
                                    </span>
                                ),
                                [DownloadSourceCategory.synapse]: (
                                    <span>
                                        Synapse (Open Access{' '}
                                        <FontAwesomeIcon
                                            color="#1adb54"
                                            icon={faLockOpen}
                                        />
                                        )
                                    </span>
                                ),
                                [DownloadSourceCategory.comingSoon]:
                                    'Coming Soon',
                            };

                            e.label =
                                downloadLabels[
                                    e.value as DownloadSourceCategory
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
