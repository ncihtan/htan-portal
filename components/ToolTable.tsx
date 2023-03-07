import { observer } from 'mobx-react';
import EnhancedDataTable, {
    IEnhancedDataTableColumn,
} from './EnhancedDataTable';
import { Tool, Tools } from '../lib/tools';
import { getDefaultDataTableStyle } from '../lib/dataTableHelpers';
import React from 'react';
import { action, makeObservable, observable } from 'mobx';
import _ from 'lodash';

interface IToolTableProps {
    tools: Tools;
}

@observer
export default class ToolTable extends React.Component<IToolTableProps, {}> {
    @observable columnVisibility: { [columnKey: string]: boolean } = {};

    constructor(props: IToolTableProps) {
        super(props);
        makeObservable(this);

        this.columnVisibility = _.mapValues(
            _.keyBy(this.defaultColumns, (c) => c.name),
            () => true
        );
    }

    get defaultColumns(): IEnhancedDataTableColumn<Tool>[] {
        return [
            {
                name: 'Tool ID',
                selector: 'Tool ID',
                wrap: true,
                sortable: true,
            },
            {
                name: 'Atlas Name',
                selector: 'Atlas Name',
                wrap: true,
                sortable: true,
            },
            {
                name: 'Tool Name',
                selector: 'Tool Name',
                wrap: true,
                sortable: true,
            },
            {
                name: 'Tool Type',
                selector: 'Tool Type',
                wrap: true,
                sortable: true,
            },
            {
                name: 'Tool Language',
                selector: 'Tool Language',
                wrap: true,
                sortable: true,
            },
        ];
    }

    @action.bound
    setColumnVisibility(vis: { [key: string]: boolean }) {
        this.columnVisibility = vis;
    }

    render() {
        return (
            <EnhancedDataTable
                columnVisibility={this.columnVisibility}
                onChangeColumnVisibility={this.setColumnVisibility}
                paginationServerOptions={{
                    persistSelectedOnPageChange: false,
                    persistSelectedOnSort: false,
                }}
                columns={this.defaultColumns}
                data={this.props.tools.data}
                striped={true}
                dense={false}
                selectableRows={false}
                pagination={true}
                paginationPerPage={20}
                paginationRowsPerPageOptions={[10, 20, 50, 100, 500]}
                noHeader={true}
                subHeader={false}
                customStyles={getDefaultDataTableStyle()}
            />
        );
    }
}
