import fileDownload from 'js-file-download';
import _ from 'lodash';
import { action, computed, makeObservable, observable } from 'mobx';
import { observer } from 'mobx-react';
import React from 'react';
import DataTable, {
    IDataTableColumn,
    IDataTableProps,
} from 'react-data-table-component';
import Children from 'react-children-utilities';

import {
    resolveColumnVisibility,
    getColumnVisibilityMap,
    getColumnKey,
} from '../lib/helpers';
import { ColumnVisibility } from './ColumnSelect';
import DataTableControls from './DataTableControls';

import { DebouncedObservable } from '@htan/data-portal-utils';

export interface IEnhancedDataTableColumn<T> extends IDataTableColumn<T> {
    toggleable?: boolean; // defaults to true if not specified (see isColumnToggleable)
    searchable?: boolean; // defaults to true if not specified (see isColumnSearchable)
    getSearchValue?: (row: T) => string;
}

interface IEnhancedDataTableProps<T> extends IDataTableProps<T> {
    columns: IEnhancedDataTableColumn<T>[];
    columnVisibility?: { [columnKey: string]: boolean };
    onChangeColumnVisibility?: (columnVisibility: {
        [columnKey: string]: boolean;
    }) => void;
    onChangeSearchText?: (searchText: string) => void;
    additionalSearchFilter?: (
        row: T,
        searchText: string,
        searchTextUpperCase: string
    ) => boolean;
    searchText?: string;
    searchBoxPlaceHolder?: string;
    customControls?: JSX.Element;
    extraControlsInsideDataTableControls?: JSX.Element;
    downloadButtonLabel?: string;
    showColumnSelect?: boolean;
}

const DEFAULT_DOWNLOAD_FILENAME = 'table_data.tsv';

function isColumnSearchable(col: IEnhancedDataTableColumn<any>) {
    return col.searchable !== false;
}

function isColumnToggleable(col: IEnhancedDataTableColumn<any>) {
    return col.toggleable !== false;
}

function getSearchValue(value: any) {
    // calling toString() only if the value is a string or a number.
    // the cell is unsearchable if every possible accessor (cell, format, and selector)
    // generates a value other than a string or a number.
    return typeof value === 'string' || typeof value === 'number'
        ? value.toString()
        : '';
}

function getDefaultTextValue<T = any>(
    d: T,
    c: IEnhancedDataTableColumn<T>,
    index: number = 0
) {
    let searchValue: string = '';

    if (c.getSearchValue) {
        searchValue = c.getSearchValue(d);
    }

    if (!searchValue && c.cell) {
        searchValue = getSearchValue(c.cell(d, index, c, 0));
    }

    if (!searchValue && c.format) {
        searchValue = getSearchValue(c.format(d, index));
    }

    if (!searchValue && c.selector) {
        if (typeof c.selector === 'string') {
            searchValue = getSearchValue(_.get(d, c.selector, ''));
        } else {
            searchValue = getSearchValue(c.selector(d, index));
        }
    }

    return searchValue;
}

function defaultSearchFunction<T = any>(
    d: T,
    c: IEnhancedDataTableColumn<T>,
    index: number = 0
) {
    return getDefaultTextValue(d, c, index).toUpperCase();
}

function getColumnName<T>(column: IEnhancedDataTableColumn<T>) {
    // Children.onlyText is probably not the best/safest way to get the column names.
    // Here we assume column.name is simple enough that only text they contain is the header title.
    return Children.onlyText(column.name);
}

function getColumnVisibility<T>(
    columns: IEnhancedDataTableColumn<T>[],
    columnVisibility: { [columnKey: string]: boolean }
): ColumnVisibility[] {
    const colVisProp: ColumnVisibility[] = [];

    (columns || [])
        .filter((column) => column.name)
        .forEach((column) => {
            const columnKey = getColumnKey(column);
            colVisProp.push({
                id: columnKey,
                name: columnKey,
                visible: columnVisibility[columnKey],
                toggleable: isColumnToggleable(column),
            });
        });

    return colVisProp;
}

class _DataTable extends React.Component<IDataTableProps> {
    // wraps it so that it only rerenders if data changes (shallow)
    shouldComponentUpdate(nextProps: Readonly<IDataTableProps>) {
        return (
            nextProps.data !== this.props.data ||
            nextProps.columns !== this.props.columns
        );
    }
    render() {
        return <DataTable {...this.props} />;
    }
}

@observer
export class EnhancedDataTable<T = any> extends React.Component<
    IEnhancedDataTableProps<T>
> {
    @observable filterText = DebouncedObservable('', 300);

    // this keeps the state of the latest action (latest user selection)
    @observable _userSelectedColumnVisibility:
        | { [columnKey: string]: boolean }
        | undefined;

    get userSelectedColumnVisibility() {
        if (this.props.onChangeColumnVisibility) {
            return this.props.columnVisibility;
        } else {
            return this._userSelectedColumnVisibility;
        }
    }

    set userSelectedColumnVisibility(vis) {
        if (this.props.onChangeColumnVisibility) {
            this.props.onChangeColumnVisibility(vis!);
        } else {
            this._userSelectedColumnVisibility = vis;
        }
    }

    constructor(props: IEnhancedDataTableProps<T>) {
        super(props);
        makeObservable(this);
    }

    get columnVisibilityByColumnDefinition() {
        return getColumnVisibilityMap(
            (this.props.columns || [])
                .filter((c) => c.name)
                .map((c) => ({
                    id: getColumnKey(c),
                    name: c.name!.toString(),
                    visible: !c.omit,
                }))
        );
    }

    @computed
    get data() {
        const searchText =
            this.props.searchText || this.filterText.debouncedValue;
        const searchTextUpperCase = searchText.toUpperCase();

        // no search text -> return unfiltered data
        if (searchTextUpperCase.length === 0) {
            return this.props.data;
        }

        // no searchable column -> return unfiltered data
        if (!_.some(this.props.columns, isColumnSearchable)) {
            return this.props.data;
        }

        return this.props.data.filter((d) => {
            const searchResults = this.props.columns
                .filter(isColumnSearchable)
                .map((c, index) => defaultSearchFunction(d, c, index))
                .map((v) => v.includes(searchTextUpperCase));

            if (this.props.additionalSearchFilter) {
                searchResults.push(
                    this.props.additionalSearchFilter(
                        d,
                        searchText,
                        searchTextUpperCase
                    )
                );
            }

            return _.some(searchResults);
        });
    }

    @computed
    get columns(): IDataTableColumn[] {
        return (this.props.columns || []).map((c) => ({
            ...c,
            omit: c.name ? !this.columnVisibility[getColumnKey(c)] : c.omit,
        }));
    }

    @computed
    get columnVisibility(): { [columnKey: string]: boolean } {
        return resolveColumnVisibility(
            this.columnVisibilityByColumnDefinition,
            this.props.columnVisibility,
            this.userSelectedColumnVisibility
        );
    }

    @computed
    get columnVisibilitySpec(): ColumnVisibility[] {
        return getColumnVisibility(this.props.columns, this.columnVisibility);
    }

    @action
    onChangeFilterText = (filterText: string) => {
        this.filterText.set(filterText);

        if (this.props.onChangeSearchText) {
            this.props.onChangeSearchText(filterText);
        }
    };

    @action
    onDownload = () => {
        // download text value for each column (visible or not)
        const columnNames = this.columns.map(getColumnName);
        const rows = this.props.data.map((d) =>
            this.columns.map((c, index) =>
                getDefaultTextValue(d, c, index).trim()
            )
        );

        const downloadText = `${columnNames.join('\t')}\n${rows
            .map((row) => row.join('\t'))
            .join('\n')}`;
        // TODO derive the filename from data/props?
        fileDownload(downloadText, DEFAULT_DOWNLOAD_FILENAME);
    };

    @action
    onVisibilityToggle = (selectedColumnKeys: string[]) => {
        // reset all column visibility
        Object.keys(this.columnVisibility).forEach((columnKey) =>
            this.updateColumnVisibility(columnKey, false)
        );

        // make selected columns visible
        selectedColumnKeys.forEach((columnKey) =>
            this.updateColumnVisibility(columnKey, true)
        );
    };

    @action
    updateColumnVisibility = (id: string, visible: boolean) => {
        const visibility =
            this.userSelectedColumnVisibility ||
            resolveColumnVisibility(
                this.columnVisibilityByColumnDefinition,
                this.props.columnVisibility
            );

        visibility[id] = visible;
        this.userSelectedColumnVisibility = visibility;
    };

    render() {
        return (
            <>
                <div
                    style={{
                        marginBottom: 10,
                    }}
                    className={'d-flex justify-content-between'}
                >
                    {this.props.customControls || <div />}
                    <DataTableControls
                        columns={this.props.columns}
                        columnVisibility={this.columnVisibilitySpec}
                        onVisibilityToggle={this.onVisibilityToggle}
                        onChangeFilterText={this.onChangeFilterText}
                        onDownload={this.onDownload}
                        searchBoxPlaceHolder={this.props.searchBoxPlaceHolder}
                        extraControls={
                            this.props.extraControlsInsideDataTableControls
                        }
                        downloadButtonLabel={this.props.downloadButtonLabel}
                        showColumnSelect={this.props.showColumnSelect}
                    />
                </div>

                <_DataTable
                    {...this.props}
                    data={this.data}
                    columns={this.columns}
                />
            </>
        );
    }
}

export default EnhancedDataTable;
