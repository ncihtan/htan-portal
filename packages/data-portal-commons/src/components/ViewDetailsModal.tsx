import _ from 'lodash';
import React from 'react';
import { Button, Modal } from 'react-bootstrap';
import Tooltip from 'rc-tooltip';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlusCircle } from '@fortawesome/free-solid-svg-icons';

import { IEnhancedDataTableColumn } from '../../../data-portal-table/src/components/EnhancedDataTable';
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
}

interface IAddColumnIconProps {
    columnVisibility: { [columnKey: string]: boolean };
    columnName: string;
    onChangeColumnVisibility: (columnVisibility: {
        [columnKey: string]: boolean;
    }) => void;
}

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

const AddColumnIcon: React.FunctionComponent<IAddColumnIconProps> = (props) => {
    return !props.columnVisibility[props.columnName] ? (
        <Tooltip overlay={<span>Add this column to the table</span>}>
            <span
                style={{
                    color: 'green',
                    marginLeft: 3,
                    cursor: 'pointer',
                }}
                onClick={() =>
                    props.onChangeColumnVisibility({
                        ...props.columnVisibility,
                        [props.columnName]: true,
                    })
                }
            >
                <FontAwesomeIcon icon={faPlusCircle} />
            </span>
        </Tooltip>
    ) : null;
};

const ViewDetailsModal = <CellData extends object>(
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
                            const cell = renderCell(column, props.cellData!);
                            if (cell) {
                                rows.push(
                                    <tr key={column.name as string}>
                                        <td>
                                            {column.name}
                                            {props.columnVisibility &&
                                                props.onChangeColumnVisibility && (
                                                    <AddColumnIcon
                                                        columnVisibility={
                                                            props.columnVisibility
                                                        }
                                                        columnName={
                                                            column.name as string
                                                        }
                                                        onChangeColumnVisibility={
                                                            props.onChangeColumnVisibility
                                                        }
                                                    />
                                                )}
                                        </td>
                                        <td>{cell}</td>
                                    </tr>
                                );
                            }
                            return rows;
                        }, [] as any[])}
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
