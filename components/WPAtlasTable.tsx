import _ from 'lodash';
import { NextRouter } from 'next/router';
import React from 'react';
import { getDefaultDataTableStyle } from '../lib/dataTableHelpers';
import { Atlas, setTab } from '../lib/helpers';
import EnhancedDataTable from './EnhancedDataTable';
import { observer } from 'mobx-react';
import { action, computed, makeObservable } from 'mobx';
import classNames from 'classnames';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faDownload } from '@fortawesome/free-solid-svg-icons';
import { ExploreTab } from './ExploreTabs';

interface IWPAtlasTableProps {
    router: NextRouter;
    synapseAtlasData: Atlas[];
    selectedAtlases?: Atlas[];
    filteredAtlases?: Atlas[];
    onSelectAtlas?: (selected: Atlas[]) => void;
}

@observer
export default class WPAtlasTable extends React.Component<IWPAtlasTableProps> {
    @computed
    get selectedAtlases() {
        return _.keyBy(this.props.selectedAtlases || [], (a) => a.htan_id);
    }

    @computed get hasAtlasesSelected() {
        return (this.props.selectedAtlases || []).length > 0;
    }

    constructor(props: IWPAtlasTableProps) {
        super(props);
        makeObservable(this);
    }

    isRowSelected = (atlas: Atlas) => {
        return this.selectedAtlases[atlas.htan_id] !== undefined;
    };

    // we need to update data every time the selection changes to rerender the table
    // see selectableRowSelected property at https://www.npmjs.com/package/react-data-table-component#row-selection
    @computed get data() {
        return (this.props.filteredAtlases || this.props.synapseAtlasData).map(
            (a) => ({
                ...a,
                isSelected: this.isRowSelected(a),
            })
        );
    }

    get columns() {
        return [
            {
                name: 'Atlas Name',
                selector: (atlas: Atlas) => atlas.htan_name,
                wrap: true,
                sortable: true,
            },
            {
                name: 'Lead Institution',
                selector: (atlas: Atlas) => atlas.WPAtlas.lead_institutions,
                grow: 2,
                wrap: true,
                sortable: true,
            },
            {
                name: 'Atlas Description',
                selector: 'WPAtlas.title.rendered',
                format: (atlas: Atlas) =>
                    atlas.WPAtlas ? atlas.WPAtlas.title.rendered : 'N/A',
                grow: 2,
                wrap: true,
                sortable: true,
            },
            {
                name: '# Cases',
                selector: 'num_cases',
                sortable: true,
            },
            {
                name: '# Biospecimens',
                selector: 'num_biospecimens',
                sortable: true,
            },
            // {
            //     name: 'Atlas ID',
            //     selector: (atlas: Atlas) => atlas.htan_id.toUpperCase(),
            //     wrap: true,
            //     sortable: true,
            // },
        ];
    }

    @action
    onSelect = (state: {
        allSelected: boolean;
        selectedCount: number;
        selectedRows: Atlas[];
    }) => {
        if (this.props.onSelectAtlas) {
            this.props.onSelectAtlas(state.selectedRows);
        }
    };

    @action onViewFiles = (e: any) => {
        e.preventDefault();
        setTab(ExploreTab.FILE, this.props.router);
    };

    render() {
        return (
            <EnhancedDataTable
                customControls={
                    <button
                        className={classNames(
                            'btn btn-primary',
                            !this.hasAtlasesSelected ? 'invisible' : ''
                        )}
                        disabled={!this.hasAtlasesSelected}
                        onMouseDown={this.onViewFiles}
                    >
                        <FontAwesomeIcon icon={faDownload} />{' '}
                        {`View files for ${
                            this.props.selectedAtlases?.length
                        } selected ${
                            this.props.selectedAtlases?.length === 1
                                ? 'atlas'
                                : 'atlases'
                        }`}
                    </button>
                }
                columns={this.columns}
                defaultSortField={'WPAtlas.lead_institutions'}
                data={this.data}
                selectableRows={true}
                onSelectedRowsChange={this.onSelect}
                selectableRowSelected={(r: { isSelected: boolean }) =>
                    r.isSelected
                }
                striped={true}
                noHeader={true}
                customStyles={getDefaultDataTableStyle()}
            />
        );
    }
}
