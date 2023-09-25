import { faExternalLinkAlt } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { observer } from 'mobx-react';
import { Tool, Tools } from '../lib/tools';
import React from 'react';
import { action, makeObservable, observable } from 'mobx';
import _ from 'lodash';
import { GeneralLink } from '../types';
import { ToolDetails } from './tool/toolDetails';

import EnhancedDataTable, {
    IEnhancedDataTableColumn,
} from '../packages/data-portal-table/src/components/EnhancedDataTable';
import { getDelimitedValues } from '../packages/data-portal-utils/src/libs/getDelimitedValues';
import { getDefaultDataTableStyle } from '../packages/data-portal-table/src/libs/helpers';
import { truncatedTableCell } from '../packages/data-portal-explore/src/libs/dataTableHelpers';
import ViewDetailsModal from '../packages/data-portal-commons/src/components/ViewDetailsModal';

interface IToolTableProps {
    tools: Tools;
}

const DETAILS_COLUMN_NAME = 'Details';

function parseUrl(url: string): GeneralLink {
    let name = url;

    if (url.includes('pubmed.ncbi.nlm.nih.gov')) {
        const parts = _.compact(url.split('/'));
        const pmid = parts[parts.length - 1];
        name = `PMID: ${pmid}`;
    }

    return { name, link: url };
}

const ExternalLink: React.FunctionComponent<{ url: string; label?: string }> = (
    props
) => {
    const parsedUrl = parseUrl(props.url);

    return (
        <a href={parsedUrl.link} target="_blank" rel="noopener noreferrer">
            {parsedUrl.name} <FontAwesomeIcon icon={faExternalLinkAlt} />
        </a>
    );
};

function renderExternalLink(url?: string, label?: string) {
    return !_.isEmpty(url) ? <ExternalLink url={url!} label={label} /> : null;
}

function renderExternalLinks(urls?: string, separator: string = ',') {
    const links = !_.isEmpty(urls)
        ? _.compact(getDelimitedValues(urls!, separator))
        : [];

    return !_.isEmpty(links) ? (
        <span>
            {links.map((link) => (
                <div className="mb-1">
                    <ExternalLink url={link} />
                </div>
            ))}
        </span>
    ) : null;
}

@observer
export default class ToolTable extends React.Component<IToolTableProps, {}> {
    @observable columnVisibility: { [columnKey: string]: boolean } = {};
    @observable viewDetailsTool: Tool | undefined = undefined;

    constructor(props: IToolTableProps) {
        super(props);
        makeObservable(this);

        this.columnVisibility = _.mapValues(
            _.keyBy(
                [...this.defaultColumns, this.detailsColumn],
                (c) => c.name
            ),
            () => true
        );
    }

    get defaultColumns(): IEnhancedDataTableColumn<Tool>[] {
        return [
            {
                name: 'Name',
                selector: 'Tool Name',
                wrap: true,
                sortable: true,
            },
            {
                name: 'Atlas',
                selector: 'Atlas Name',
                wrap: true,
                sortable: true,
            },
            {
                name: 'Type',
                selector: 'Tool Type',
                wrap: true,
                sortable: true,
            },
            /*{
                name: 'Topic',
                selector: 'Tool Topic',
                wrap: true,
                sortable: true,
            },*/
            {
                name: 'Assay',
                selector: 'Tool Assay',
                wrap: true,
                sortable: true,
            },
            {
                name: 'Publication',
                selector: 'Tool Publication',
                cell: (tool: Tool) =>
                    renderExternalLinks(tool['Tool Publication']),
                wrap: true,
                sortable: true,
            },
            {
                name: 'Homepage',
                selector: 'Tool Homepage',
                cell: (tool: Tool) => renderExternalLink(tool['Tool Homepage']),
                wrap: true,
                sortable: true,
            },
        ];
    }

    get detailsColumn() {
        return {
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
        };
    }

    get columns(): IEnhancedDataTableColumn<Tool>[] {
        return [
            ...this.defaultColumns,
            {
                name: 'Description',
                selector: 'Tool Description',
                cell: truncatedTableCell,
                wrap: true,
                sortable: true,
            },
            {
                name: 'Operation',
                selector: 'Tool Operation',
                wrap: true,
                sortable: true,
            },
            {
                name: 'Input Data',
                selector: 'Tool Input Data',
                wrap: true,
                sortable: true,
            },
            {
                name: 'Output Data',
                selector: 'Tool Output Data',
                wrap: true,
                sortable: true,
            },
            {
                name: 'Language',
                selector: 'Tool Language',
                wrap: true,
                sortable: true,
            },
            {
                name: 'ID',
                selector: 'Tool ID',
                wrap: true,
                sortable: true,
            },
            this.detailsColumn,
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
                    customContent={
                        this.viewDetailsTool &&
                        ToolDetails[this.viewDetailsTool['Tool ID']]
                    }
                />

                <EnhancedDataTable
                    columnVisibility={this.columnVisibility}
                    onChangeColumnVisibility={this.setColumnVisibility}
                    paginationServerOptions={{
                        persistSelectedOnPageChange: false,
                        persistSelectedOnSort: false,
                    }}
                    columns={this.columns}
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
