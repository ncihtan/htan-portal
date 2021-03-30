import _ from 'lodash';
import { action, computed, makeObservable, observable } from 'mobx';
import { observer } from 'mobx-react';
import React from 'react';
import DataTable, {
    IDataTableColumn,
    IDataTableProps,
} from 'react-data-table-component';

import {
    resolveColumnVisibility,
    resolveColumnVisibilityByColumnDefinition,
} from '../lib/dataTableHelpers';
import DebouncedObservable from '../lib/DebouncedObservable';
import { ColumnVisibilityDef } from './ColumnSelect';
import DataTableControls from './DataTableControls';

interface IEnhancedDataTableColumn<T> extends IDataTableColumn<T> {
    toggleable?: boolean; // defaults to true if not specified (see isColumnToggleable)
    searchable?: boolean; // defaults to true if not specified (see isColumnSearchable)
    getSearchValue?: (row: T) => string;
}

interface IEnhancedDataTableProps<T> extends IDataTableProps<T> {
    columns: IEnhancedDataTableColumn<T>[];
    columnVisibility?: { [columnId: string]: boolean };
    onChangeSearchText?: (searchText: string) => void;
    additionalSearchFilter?: (
        row: T,
        searchText: string,
        searchTextUpperCase: string
    ) => boolean;
    searchText?: string;
    searchBoxPlaceHolder?: string;
    customControls?: JSX.Element;
}

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

function defaultSearchFunction<T = any>(
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

    return searchValue.toUpperCase();
}

function getColumnVisibilityDef<T>(
    columns: IEnhancedDataTableColumn<T>[],
    columnVisibility: { [columnId: string]: boolean }
): ColumnVisibilityDef[] {
    const colVisProp: ColumnVisibilityDef[] = [];

    (columns || [])
        .filter((column) => column.name)
        .forEach((column) =>
            colVisProp.push({
                id: column.name!.toString(),
                name: column.name!.toString(),
                visible: columnVisibility[column.name!.toString()],
                toggleable: isColumnToggleable(column),
            })
        );

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
export default class EnhancedDataTable<T = any> extends React.Component<
    IEnhancedDataTableProps<T>
> {
    @observable filterText = DebouncedObservable('', 300);

    // this keeps the state of the latest action (latest user selection)
    @observable _columnVisibilityOverride:
        | { [columnId: string]: boolean }
        | undefined;

    constructor(props: IEnhancedDataTableProps<T>) {
        super(props);
        makeObservable(this);
    }

    get columnVisibilityByColumnDefinition() {
        return resolveColumnVisibilityByColumnDefinition(
            (this.props.columns || [])
                .filter((c) => c.name)
                .map((c) => ({
                    name: c.name!.toString(),
                    id: c.name!.toString(),
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
            omit: c.name ? !this.columnVisibility[c.name.toString()] : c.omit,
        }));
    }

    @computed
    get columnVisibility(): { [columnId: string]: boolean } {
        return resolveColumnVisibility(
            this.columnVisibilityByColumnDefinition,
            this.props.columnVisibility,
            this._columnVisibilityOverride
        );
    }

    @computed
    get columnVisibilityDef(): ColumnVisibilityDef[] {
        return getColumnVisibilityDef(
            this.props.columns,
            this.columnVisibility
        );
    }

    @action
    onChangeFilterText = (filterText: string) => {
        this.filterText.set(filterText);

        if (this.props.onChangeSearchText) {
            this.props.onChangeSearchText(filterText);
        }
    };

    @action
    onVisibilityToggle = (selectedColumnIds: string[]) => {
        // reset all column visibility
        Object.keys(this.columnVisibility).forEach((columnId) =>
            this.updateColumnVisibility(columnId, false)
        );

        // make selected columns visible
        selectedColumnIds.forEach((columnId) =>
            this.updateColumnVisibility(columnId, true)
        );
    };

    @action
    updateColumnVisibility = (id: string, visible: boolean) => {
        // no previous action, need to init
        if (this._columnVisibilityOverride === undefined) {
            this._columnVisibilityOverride = resolveColumnVisibility(
                this.columnVisibilityByColumnDefinition,
                this.props.columnVisibility
            );
        }

        // update visibility
        if (
            this._columnVisibilityOverride &&
            this._columnVisibilityOverride[id] !== undefined
        ) {
            this._columnVisibilityOverride[id] = visible;
        }
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
                    {this.props.customControls}
                    <DataTableControls
                        columns={this.props.columns}
                        columnVisibility={this.columnVisibilityDef}
                        onVisibilityToggle={this.onVisibilityToggle}
                        onChangeFilterText={this.onChangeFilterText}
                        searchBoxPlaceHolder={this.props.searchBoxPlaceHolder}
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
