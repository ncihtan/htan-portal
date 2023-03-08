import { observer } from 'mobx-react';
import EnhancedDataTable, {
    IEnhancedDataTableColumn,
} from './EnhancedDataTable';
import { Tool, Tools } from '../lib/tools';
import { getDefaultDataTableStyle } from '../lib/dataTableHelpers';
import React from 'react';
import { action, makeObservable, observable } from 'mobx';
import _ from 'lodash';
import ViewDetailsModal from './ViewDetailsModal';

interface IToolTableProps {
    tools: Tools;
}

const DETAILS_COLUMN_NAME = 'Details';

@observer
export default class ToolTable extends React.Component<IToolTableProps, {}> {
    @observable columnVisibility: { [columnKey: string]: boolean } = {};
    @observable viewDetailsTool: Tool | undefined = undefined;

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
            {
                name: DETAILS_COLUMN_NAME,
                selector: () => 'Details',
                cell: (tool: Tool) => {
                    return (
                        <a
                            href={'#'}
                            onClick={action(() => {
                                this.viewDetailsTool = tool;
                            })}
                        >
                            View Details
                        </a>
                    );
                },
                wrap: true,
                sortable: false,
                searchable: false,
            },
        ];
    }

    get columns(): IEnhancedDataTableColumn<Tool>[] {
        return [
            ...this.defaultColumns,
            // adding these columns so that they will show up in the details modal
            // we don't necessarily need to make these columns available in the actual table
            {
                name: 'Parent ID',
                selector: 'Parent ID',
                wrap: true,
                sortable: true,
            },
            {
                name: 'Tool Publication',
                selector: 'Tool Publication',
                wrap: true,
                sortable: true,
            },
            {
                name: 'Tool Homepage',
                selector: 'Tool Homepage',
                wrap: true,
                sortable: true,
            },
            {
                name: 'Tool Description',
                selector: 'Tool Description',
                wrap: true,
                sortable: true,
            },
            {
                name: 'Tool Topic',
                selector: 'Tool Topic',
                wrap: true,
                sortable: true,
            },
            {
                name: 'Tool Operation',
                selector: 'Tool Operation',
                wrap: true,
                sortable: true,
            },
            {
                name: 'Tool Input Data',
                selector: 'Tool Input Data',
                wrap: true,
                sortable: true,
            },
            {
                name: 'Tool Output Data',
                selector: 'Tool Output Data',
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
            <>
                <ViewDetailsModal
                    cellData={this.viewDetailsTool}
                    onClose={this.onViewDetailsModalClose}
                    columns={this.columns.filter(
                        (c) => c.name !== DETAILS_COLUMN_NAME
                    )}
                />

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
            </>
        );
    }

    @action onViewDetailsModalClose = () => {
        this.viewDetailsTool = undefined;
    };
}
