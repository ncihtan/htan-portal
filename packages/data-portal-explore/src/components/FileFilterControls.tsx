import { observer } from 'mobx-react';
import React from 'react';

import {
    FilterControls,
    FilterDropdown,
    getDropdownOptionsFromProps,
    getOptionsFromProps,
    IFilterControlsProps,
    IGenericFilterControlProps,
} from '@htan/data-portal-filter';
import { AttributeNames } from '@htan/data-portal-utils';
import { Entity, FileAttributeMap } from '@htan/data-portal-commons';

import styles from './fileFilterControls.module.scss';
import _ from 'lodash';

interface IFileFilterControlProps
    extends IFilterControlsProps<Entity, AttributeNames> {
    enableReleaseFilter?: boolean;
}

export const FileFilterControls: React.FunctionComponent<IFileFilterControlProps> = observer(
    (props) => {
        const filterControlsProps: IGenericFilterControlProps<any, any> = {
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
            ],
            entities: [],
            setFilter: props.setFilter,
            selectedFiltersByGroupName: props.selectedFiltersByGroupName,
            selectedFilters: [],
            groupsByProperty: props.groupsByProperty,
        };

        // const filterControlsProps = {
        //     ...props,
        //     countHeader: 'Files',
        //     attributeMap: FileAttributeMap,
        //     attributeNames: [
        //         AttributeNames.AtlasName,
        //         AttributeNames.TissueorOrganofOrigin,
        //         AttributeNames.PrimaryDiagnosis,
        //         AttributeNames.assayName,
        //         AttributeNames.Level,
        //         AttributeNames.FileFormat,
        //         AttributeNames.TreatmentType,
        //     ],
        // };

        // const options = getOptionsFromProps(filterControlsProps);
        // const dropdownProps = getDropdownOptionsFromProps(
        //     filterControlsProps,
        //     options
        // );

        const options = (str: string) => {
            if (str in props.groupsByProperty) {
                return _(props.groupsByProperty[str])
                    .map((val, key) => {
                        return {
                            value: val.val,
                            label: val.val,
                            group: str,
                            fieldType: val.fieldType,
                            isSelected: false,
                            count: val.count,
                        };
                    })
                    .value();
            } else {
                return [];
            }
        };

        const dropdownProps = {
            options,
            countHeader: filterControlsProps.countHeader,
            setFilter: filterControlsProps.setFilter,
            selectedFiltersByGroupName:
                filterControlsProps.selectedFiltersByGroupName,
            attributeMap: FileAttributeMap,
        };

        return (
            <FilterControls {...filterControlsProps}>
                <FilterDropdown
                    {...dropdownProps}
                    attributes={[
                        AttributeNames.organType,
                        AttributeNames.TissueorOrganofOrigin,
                    ]}
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
                    placeholder="Disease"
                    attributes={[AttributeNames.PrimaryDiagnosis]}
                    className={styles.filterCheckboxListContainer}
                    width={164}
                />

                <FilterDropdown
                    {...dropdownProps}
                    placeholder="Treatment"
                    attributes={[AttributeNames.TreatmentType]}
                    className={styles.filterCheckboxListContainer}
                    width={164}
                />

                <FilterDropdown
                    {...dropdownProps}
                    placeholder="Viewers"
                    attributes={[AttributeNames.viewersArr]}
                    className={styles.filterCheckboxListContainer}
                    width={164}
                />

                <FilterDropdown
                    {...dropdownProps}
                    placeholder="Assay"
                    attributes={[AttributeNames.assayName]}
                    className={styles.filterCheckboxListContainer}
                    width={164}
                />

                <FilterDropdown
                    {...dropdownProps}
                    placeholder="File"
                    attributes={[
                        AttributeNames.level,
                        AttributeNames.FileFormat,
                    ]}
                    className={styles.filterCheckboxListContainer}
                    width={164}
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
