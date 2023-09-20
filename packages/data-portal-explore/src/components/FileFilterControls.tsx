import { observer } from 'mobx-react';
import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faLockOpen } from '@fortawesome/free-solid-svg-icons';

import FilterControls from '../../../data-portal-filter/src/components/FilterControls';
import { AttributeNames } from '../../../data-portal-utils/src/libs/types';
import FilterDropdown from '../../../data-portal-filter/src/components/FilterDropdown';
import {
    getDropdownOptionsFromProps,
    getOptionsFromProps,
} from '../../../data-portal-filter/src/libs/helpers';
import { FileAttributeMap } from '../../../data-portal-commons/src/libs/types';
import {
    DownloadSourceCategory,
    Entity,
} from '../../../data-portal-commons/src/libs/entity';
import {
    IFilterControlsProps,
    OptionType,
} from '../../../data-portal-filter/src/libs/types';

interface IFileFilterControlProps
    extends IFilterControlsProps<Entity, AttributeNames> {
    enableReleaseFilter?: boolean;
}

const FileFilterControls: React.FunctionComponent<IFileFilterControlProps> = observer(
    (props) => {
        const filterControlsProps = {
            ...props,
            countHeader: 'Files',
            attributeMap: FileAttributeMap,
            attributeNames: [
                AttributeNames.AtlasName,
                AttributeNames.TissueorOrganofOrigin,
                AttributeNames.PrimaryDiagnosis,
                AttributeNames.assayName,
                AttributeNames.Level,
                AttributeNames.FileFormat,
            ],
        };

        const options = getOptionsFromProps(filterControlsProps);
        const dropdownProps = getDropdownOptionsFromProps(
            filterControlsProps,
            options
        );

        return (
            <FilterControls {...filterControlsProps}>
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
                    attributes={[
                        AttributeNames.Level,
                        AttributeNames.FileFormat,
                    ]}
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
                {props.enableReleaseFilter && (
                    <FilterDropdown
                        {...dropdownProps}
                        attributes={[AttributeNames.releaseVersion]}
                        width={120}
                    />
                )}
            </FilterControls>
        );
    }
);

export default FileFilterControls;
