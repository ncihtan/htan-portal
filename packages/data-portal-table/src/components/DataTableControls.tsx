import React, { SyntheticEvent } from 'react';
import { IDataTableColumn } from 'react-data-table-component';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faDownload, faSearch } from '@fortawesome/free-solid-svg-icons';
import Tooltip from 'rc-tooltip';

import styles from './dataTable.module.scss';

import ColumnSelect, {
    ColumnVisibility,
    IColumnSelectProps,
} from './ColumnSelect';

interface IDataTableControlsProps {
    columnVisibility?: ColumnVisibility[];
    columns: IDataTableColumn[];
    onVisibilityToggle?: (selectedColumnKeys: string[]) => void;
    onDownload?: () => void;
    columnSelectProps?: IColumnSelectProps;
    onChangeFilterText?: (filterText: string) => void;
    searchBoxPlaceHolder?: string;
    filterText?: string;
    extraControls?: JSX.Element;
}

export default class DataTableControls extends React.Component<IDataTableControlsProps> {
    onChangeFilterText = (evt: SyntheticEvent<any>) => {
        const caseFilterText = (evt.target as any).value;

        if (this.props.onChangeFilterText) {
            this.props.onChangeFilterText(caseFilterText);
        }
    };

    render() {
        return (
            <div className={styles.dataTableControls}>
                <Tooltip
                    overlay={
                        <span>
                            Download the entire table data including the hidden
                            columns as a TSV file
                        </span>
                    }
                    placement="left"
                >
                    <button className="btn" onClick={this.props.onDownload}>
                        <FontAwesomeIcon icon={faDownload} />
                    </button>
                </Tooltip>
                {this.props.extraControls}
                <ColumnSelect
                    columnVisibility={this.props.columnVisibility}
                    onColumnToggled={this.props.onVisibilityToggle}
                    {...this.props.columnSelectProps}
                />
                <div className="input-group" style={{ width: 400 }}>
                    <input
                        className="form-control py-2 border-right-0 border"
                        type="search"
                        onInput={this.onChangeFilterText}
                        value={this.props.filterText}
                        placeholder={
                            this.props.searchBoxPlaceHolder || 'Search'
                        }
                        id="datatable-filter-text-input"
                    />
                    <div className="input-group-append">
                        <div className="input-group-text bg-transparent">
                            {' '}
                            <FontAwesomeIcon icon={faSearch} />
                        </div>
                    </div>
                </div>
            </div>
        );
    }
}
