import * as React from 'react';
import { IDataTableColumn, IDataTableProps } from 'react-data-table-component';
import { computed, makeObservable } from 'mobx';
import { observer, Observer } from 'mobx-react';
import DataTable from 'react-data-table-component';
import _ from 'lodash';

type SearchFunction<T> = (
    t: T,
    searchTextUpperCase: string,
    searchText: string
) => boolean;
interface ISearchableDataTableColumn<T> extends IDataTableColumn<T> {
    searchable?: boolean; // defaults to true if not specified (see isColumnSearchable)
}

interface ISearchableDataTableProps<T>
    extends Omit<IDataTableProps, 'columns'> {
    columns: ISearchableDataTableColumn<T>[];
    searchText: string;
    additionalSearchFunction?: SearchFunction<T>;
}

function isColumnSearchable(col: ISearchableDataTableColumn<any>) {
    return col.searchable !== false;
}

function makeDefaultSearchFunction<T>(col: ISearchableDataTableColumn<T>) {
    return (t: T, searchTextUpperCase: string) => {
        let value: string | undefined;
        if (col.format) {
            value = col.format(t, 0) as string | undefined;
        } else if (typeof col.selector === 'string') {
            value = _.at<any>(t, col.selector)[0] as string | undefined;
        } else {
            value = col.selector!(t, 0) as string | undefined;
        }

        if (!value) {
            return false;
        } else {
            return value.toUpperCase().includes(searchTextUpperCase);
        }
    };
}

class _DataTable extends React.Component<IDataTableProps> {
    // wraps it so that it only rerenders if data changes (shallow)
    shouldComponentUpdate(nextProps: Readonly<IDataTableProps>) {
        return nextProps.data !== this.props.data;
    }
    render() {
        return <DataTable {...this.props} />;
    }
}

@observer
export default class SearchableDataTable<T> extends React.Component<
    ISearchableDataTableProps<T>
> {
    @computed get data() {
        const searchText = this.props.searchText;
        const searchTextUpperCase = this.props.searchText.toUpperCase();

        // no search text -> return unfiltered data
        if (searchTextUpperCase.length === 0) {
            return this.props.data;
        }

        // no searchable column -> return unfiltered data
        if (
            !this.props.additionalSearchFunction &&
            !_.some(this.props.columns, isColumnSearchable)
        ) {
            return this.props.data;
        }

        return this.props.data.filter((d) => {
            const searchFunctions = [this.props.additionalSearchFunction]
                .concat(
                    this.props.columns.map((c) => {
                        if (isColumnSearchable(c)) {
                            return makeDefaultSearchFunction(c);
                        } else {
                            return undefined;
                        }
                    })
                )
                .filter((x) => !!x) as SearchFunction<T>[];

            return _.some(searchFunctions, (fn) =>
                fn(d, searchTextUpperCase, searchText)
            );
        });
    }

    render() {
        const {
            data,
            searchText,
            additionalSearchFunction,
            ...rest
        } = this.props;
        return <_DataTable data={this.data} {...rest} />;
    }
}
