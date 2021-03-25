import { action, computed, makeObservable, observable } from 'mobx';
import { observer } from 'mobx-react';
import React  from 'react';
import DataTable, {
    IDataTableColumn,
    IDataTableProps,
} from 'react-data-table-component';

import {
    resolveColumnVisibility,
    resolveColumnVisibilityByColumnDefinition,
} from '../lib/dataTableHelpers';
import { ColumnVisibilityDef } from './ColumnSelect';
import DataTableControls from './DataTableControls';

interface IEnhancedDataTableColumn<T> extends IDataTableColumn<T> {
    toggleable?: boolean;
}

interface IEnhancedDataTableProps<T> extends IDataTableProps<T> {
    columns: IEnhancedDataTableColumn<T>[];
    columnVisibility?: { [columnId: string]: boolean };
    onChangeFilterText?: (filterText: string) => void;
    searchBoxPlaceHolder?: string;
    customControls?: JSX.Element;
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
                toggleable:
                    column.toggleable !== undefined ? column.toggleable : true,
            })
        );

    return colVisProp;
}

@observer
export default class EnhancedDataTable<T = any> extends React.Component<
    IEnhancedDataTableProps<T>
> {
    @observable filterText = '';

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
        this.filterText = filterText;

        if (this.props.onChangeFilterText) {
            this.props.onChangeFilterText(filterText);
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

                <DataTable {...this.props} columns={this.columns} />
            </>
        );
    }
}
