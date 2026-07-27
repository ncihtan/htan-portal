import _ from 'lodash';
import React from 'react';
import { Button, Modal } from 'react-bootstrap';
import Tooltip from 'rc-tooltip';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlusCircle } from '@fortawesome/free-solid-svg-icons';

import {
    formatMetadataFieldName,
    IEnhancedDataTableColumn,
} from '@htan/data-portal-table';
import styles from './ViewDetailsModal.module.scss';

interface IViewDetailsModalProps<CellData> {
    cellData?: CellData;
    onClose: () => void;
    columns: IEnhancedDataTableColumn<CellData>[];
    columnVisibility?: { [columnKey: string]: boolean };
    onChangeColumnVisibility?: (columnVisibility: {
        [columnKey: string]: boolean;
    }) => void;
    customContent?: JSX.Element;
    additionalFields?: { [key: string]: any };
    disabledAddColumns?: string[];
}

interface IAddColumnIconProps {
    columnVisibility: { [columnKey: string]: boolean };
    columnName: string;
    onChangeColumnVisibility: (columnVisibility: {
        [columnKey: string]: boolean;
    }) => void;
    isDisabled?: boolean;
}

const EXCLUDED_METADATA_FIELDS = new Set([
    'AtlasMeta',
    'HTANParentDataFileID',
    'HTANDataFileID',
    'HTANParentBiospecimenID',
    'HTANParticipantID',
]);

const METADATA_FIELD_NAME_OVERRIDES: { [key: string]: string } = {
    SynapseIDofGeoMxDSPROISegmentAnnotationFile:
        'Synapse ID of GeoMx DSP ROI Segment Annotation File',
    SynapseIDofGeoMxDSPPKCFile: 'Synapse ID of GeoMx DSP PKC File',
    SynapseIDofGeoMxLabWorksheetFile: 'Synapse ID of GeoMx Lab Worksheet File',
    ROIname: 'ROI Name',
};

function renderCell<CellData>(
    column: IEnhancedDataTableColumn<CellData>,
    data: CellData
) {
    if (column.cell) {
        return (column.cell as any)(data);
    } else if (typeof column.selector === 'string') {
        return _.get(data, column.selector);
    } else if (column.selector) {
        return (column.selector as any)(data);
    }
}

function isEmptyCellValue(value: any): boolean {
    if (value === null || value === undefined) {
        return true;
    }

    if (typeof value === 'string') {
        return value.trim() === '';
    }

    if (Array.isArray(value)) {
        return value.length === 0 || value.every(isEmptyCellValue);
    }

    if (React.isValidElement(value)) {
        return isEmptyCellValue((value as any).props?.children);
    }

    if (typeof value === 'object') {
        return Object.keys(value).length === 0;
    }

    return false;
}

const AddColumnIcon: React.FunctionComponent<IAddColumnIconProps> = (props) => {
    return !props.columnVisibility[props.columnName] ? (
        <Tooltip
            overlay={
                <span>
                    {props.isDisabled
                        ? 'Cannot add fetched metadata columns to table'
                        : 'Add this column to the table'}
                </span>
            }
        >
            <span
                style={{
                    color: props.isDisabled ? '#ccc' : 'green',
                    marginLeft: 3,
                    cursor: props.isDisabled ? 'not-allowed' : 'pointer',
                    opacity: props.isDisabled ? 0.5 : 1,
                }}
                onClick={() => {
                    if (!props.isDisabled) {
                        props.onChangeColumnVisibility({
                            ...props.columnVisibility,
                            [props.columnName]: true,
                        });
                    }
                }}
            >
                <FontAwesomeIcon icon={faPlusCircle} />
            </span>
        </Tooltip>
    ) : null;
};

export const ViewDetailsModal = <CellData extends object>(
    props: IViewDetailsModalProps<CellData>
) => {
    if (!props.cellData) {
        return null;
    }
    return (
        <Modal
            dialogClassName={styles.fileTableViewDetailsModal}
            show={props.cellData !== undefined}
            onHide={props.onClose}
        >
            <Modal.Header closeButton>
                <Modal.Title>Details</Modal.Title>
            </Modal.Header>

            <Modal.Body>
                <table className="table table-bordered">
                    <colgroup>
                        <col style={{ width: '20%' }} />
                        <col style={{ width: '80%' }} />
                    </colgroup>
                    <tbody>
                        {props.columns.reduce((rows, column) => {
                            const rawColumnName = column.name as string;
                            if (EXCLUDED_METADATA_FIELDS.has(rawColumnName)) {
                                return rows;
                            }
                            const cell = renderCell(column, props.cellData!);
                            if (!isEmptyCellValue(cell)) {
                                rows.push(
                                    <tr key={rawColumnName}>
                                        <td>
                                            {formatMetadataFieldName(
                                                rawColumnName,
                                                METADATA_FIELD_NAME_OVERRIDES
                                            )}
                                            {props.columnVisibility &&
                                                props.onChangeColumnVisibility && (
                                                    <AddColumnIcon
                                                        columnVisibility={
                                                            props.columnVisibility
                                                        }
                                                        columnName={
                                                            rawColumnName
                                                        }
                                                        onChangeColumnVisibility={
                                                            props.onChangeColumnVisibility
                                                        }
                                                        isDisabled={props.disabledAddColumns?.includes(
                                                            rawColumnName
                                                        )}
                                                    />
                                                )}
                                        </td>
                                        <td>{cell}</td>
                                    </tr>
                                );
                            }
                            return rows;
                        }, [] as any[])}
                        {props.additionalFields &&
                            Object.entries(props.additionalFields).map(
                                ([fieldName, fieldValue]) => {
                                    if (
                                        EXCLUDED_METADATA_FIELDS.has(fieldName)
                                    ) {
                                        return null;
                                    }
                                    if (!isEmptyCellValue(fieldValue)) {
                                        return (
                                            <tr key={`additional-${fieldName}`}>
                                                <td>
                                                    {formatMetadataFieldName(
                                                        fieldName,
                                                        METADATA_FIELD_NAME_OVERRIDES
                                                    )}
                                                </td>
                                                <td>
                                                    {Array.isArray(fieldValue)
                                                        ? fieldValue.join(', ')
                                                        : typeof fieldValue ===
                                                          'object'
                                                        ? JSON.stringify(
                                                              fieldValue
                                                          )
                                                        : String(fieldValue)}
                                                </td>
                                            </tr>
                                        );
                                    }
                                    return null;
                                }
                            )}
                    </tbody>
                </table>
                {props.customContent}
            </Modal.Body>

            <Modal.Footer>
                <Button variant="secondary" onClick={props.onClose}>
                    Close
                </Button>
            </Modal.Footer>
        </Modal>
    );
};

export default ViewDetailsModal;
