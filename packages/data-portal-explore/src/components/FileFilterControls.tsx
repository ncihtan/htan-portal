import { observer } from 'mobx-react';
import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faLock, faLockOpen } from '@fortawesome/free-solid-svg-icons';

import {
    FilterControls,
    FilterDropdown,
    getDropdownOptionsFromProps,
    getOptionsFromProps,
    IFilterControlsProps,
    IGenericFilterControlProps,
    OptionType,
} from '@htan/data-portal-filter';
import { AttributeNames } from '@htan/data-portal-utils';
import {
    DownloadSourceCategory,
    Entity,
    FileAttributeMap,
    FileViewerName,
} from '@htan/data-portal-commons';

import styles from './fileFilterControls.module.scss';

interface IFileFilterControlProps
    extends IFilterControlsProps<Entity, AttributeNames> {
    enableReleaseFilter?: boolean;
}

export const FileFilterControls: React.FunctionComponent<IFileFilterControlProps> = observer(
    (props) => {
        const filterControlsProps: IGenericFilterControlProps<
            Entity,
            AttributeNames
        > = {
            countHeader: 'Files',
            attributeMap: FileAttributeMap,
            attributeNames: [
                AttributeNames.AtlasName,
                AttributeNames.TissueorOrganofOrigin,
                AttributeNames.PrimaryDiagnosis,
                AttributeNames.assayName,
                AttributeNames.level,
                AttributeNames.FileFormat,
                AttributeNames.TreatmentType,
                AttributeNames.downloadSource,
            ],
            entities: [],
            setFilter: props.setFilter,
            selectedFiltersByGroupName: props.selectedFiltersByGroupName,
            selectedFilters: [],
            groupsByProperty: props.groupsByProperty,
            optionMapper: (val, key) => ({
                value: val.val,
                label: val.val,
                count: parseInt(val.count),
            }),
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
                    placeholder="Atlas"
                    attributes={[AttributeNames.AtlasName]}
                    className={styles.filterCheckboxListContainer}
                />

                <FilterDropdown
                    {...dropdownProps}
                    attributes={[
                        AttributeNames.organType,
                        AttributeNames.TissueorOrganofOrigin,
                    ]}
                    className={styles.filterCheckboxListContainer}
                />

                <FilterDropdown
                    {...dropdownProps}
                    placeholder="Disease"
                    attributes={[AttributeNames.PrimaryDiagnosis]}
                    className={styles.filterCheckboxListContainer}
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
                    className={styles.filterCheckboxListContainer}
                    width={164}
                />

                <FilterDropdown
                    {...dropdownProps}
                    placeholder="Treatment"
                    attributes={[AttributeNames.TreatmentType]}
                    className={styles.filterCheckboxListContainer}
                    width={120}
                />

                <FilterDropdown
                    {...dropdownProps}
                    placeholder="Assay"
                    attributes={[AttributeNames.assayName]}
                    className={styles.filterCheckboxListContainer}
                />

                <FilterDropdown
                    {...dropdownProps}
                    placeholder="File"
                    attributes={[
                        AttributeNames.level,
                        AttributeNames.FileFormat,
                    ]}
                    className={styles.filterCheckboxListContainer}
                    width={80}
                />

                <FilterDropdown
                    {...dropdownProps}
                    placeholder="Data Access"
                    attributes={[AttributeNames.downloadSource]}
                    className={styles.filterCheckboxListContainer}
                    width={150}
                    options={(attrName: AttributeNames) => {
                        return options(attrName)
                            .sort((a: OptionType, b: OptionType) => {
                                const downloadSourceOrder = [
                                    DownloadSourceCategory.dbgap,
                                    DownloadSourceCategory.crdcGc,
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
                                    [DownloadSourceCategory.dbgap]: (
                                        <span>
                                            CRDC-GC/SB-CGC (dbGaP{' '}
                                            <FontAwesomeIcon
                                                color="#FF8C00"
                                                icon={faLock}
                                            />
                                            )
                                        </span>
                                    ),
                                    // [DownloadSourceCategory.idc]: 'IDC (Imaging)',
                                    [DownloadSourceCategory.crdcGc]: (
                                        <span>
                                            CRDC-GC/SB-CGC (Open Access{' '}
                                            <FontAwesomeIcon
                                                color="#00796B"
                                                icon={faLockOpen}
                                            />
                                            )
                                        </span>
                                    ),
                                    [DownloadSourceCategory.synapse]: (
                                        <span>
                                            Synapse (Open Access{' '}
                                            <FontAwesomeIcon
                                                color="#00796B"
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

                <FilterDropdown
                    {...dropdownProps}
                    placeholder="Viewer"
                    attributes={[AttributeNames.viewersArr]}
                    className={styles.filterCheckboxListContainer}
                    options={(attrName: AttributeNames) => {
                        return options(attrName)
                            .filter(
                                (e: OptionType) =>
                                    ![
                                        FileViewerName.crdcGc,
                                        FileViewerName.idc,
                                    ].includes(e.value as FileViewerName)
                            )
                            .map((e: OptionType) => {
                                const viewerLabels = {
                                    [FileViewerName.autoMinerva]: 'Autominerva',
                                    [FileViewerName.customMinerva]:
                                        'Minerva Story',
                                    [FileViewerName.ucscXena]: 'UCSC Xena',
                                    [FileViewerName.cellxgene]: 'CellxGene',
                                    [FileViewerName.isbcgc]: 'BigQuery',

                                    // excluded values:
                                    // we are not supposed to see these as filter options
                                    [FileViewerName.crdcGc]: 'CRDC-GC', // excluded (this only appears as a download source)
                                    [FileViewerName.idc]: 'IDC', // excluded (we do not show IDC links anymore)
                                };

                                e.label =
                                    viewerLabels[e.value as FileViewerName];
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
