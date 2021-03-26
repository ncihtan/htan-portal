import * as React from 'react';
import { IDataTableColumn, IDataTableProps } from 'react-data-table-component';
import { computed, makeObservable } from 'mobx';
import { observer } from 'mobx-react';
import DataTable from 'react-data-table-component';
import _ from 'lodash';

type SearchFunction<T> = (t: T, searchText: string) => boolean;
interface ISearchableTableProps<T> extends Omit<IDataTableProps, 'columns'> {
    columns: (IDataTableColumn<T> & { search?: SearchFunction<T> })[];
    searchText: string;
    additionalSearchFunction?: SearchFunction<T>;
}

@observer
export default class SearchableTable<T> extends React.Component<
    ISearchableTableProps<T>
> {
    constructor(props: any) {
        super(props);
        makeObservable(this);
    }

    @computed get data() {
        const searchText = this.props.searchText;

        // no search text -> return unfiltered data
        if (searchText.length === 0) {
            return this.props.data;
        }

        // no search functions -> return unfiltered data
        if (
            !this.props.additionalSearchFunction &&
            !_.some(this.props.columns, (c) => c.search)
        ) {
            return this.props.data;
        }

        return this.props.data.filter((d) => {
            const searchFunctions = [this.props.additionalSearchFunction]
                .concat(this.props.columns.map((c) => c.search))
                .filter((x) => !!x) as SearchFunction<T>[];

            return _.some(searchFunctions, (fn) => fn(d, searchText));
        });
    }

    render() {
        const { data, ...rest } = this.props;
        return <DataTable data={this.data} {...rest} />;
    }
}
