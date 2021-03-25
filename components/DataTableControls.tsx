import React, { SyntheticEvent } from 'react';
import { IDataTableColumn } from 'react-data-table-component';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSearch } from '@fortawesome/free-solid-svg-icons';

import ColumnSelect, {
    ColumnVisibilityDef,
    IColumnSelectProps,
} from './ColumnSelect';

interface IDataTableControlsProps {
    columnVisibility?: ColumnVisibilityDef[];
    columns: IDataTableColumn[];
    onVisibilityToggle?: (selectedColumnIds: string[]) => void;
    columnSelectProps?: IColumnSelectProps;
    onChangeFilterText?: (filterText: string) => void;
    searchBoxPlaceHolder?: string;
    filterText?: string;
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
            <div className="input-group ml-auto" style={{ width: 400 }}>
                <span className="mr-1">
                    <ColumnSelect
                        columnVisibility={this.props.columnVisibility}
                        onColumnToggled={this.props.onVisibilityToggle}
                        {...this.props.columnSelectProps}
                    />
                </span>
                <input
                    className="form-control py-2 border-right-0 border"
                    type="search"
                    onInput={this.onChangeFilterText}
                    value={this.props.filterText}
                    placeholder={this.props.searchBoxPlaceHolder || 'Search'}
                    id="datatable-filter-text-input"
                />
                <span className="input-group-append">
                    <div className="input-group-text bg-transparent">
                        {' '}
                        <FontAwesomeIcon icon={faSearch} />
                    </div>
                </span>
            </div>
        );
    }
}
