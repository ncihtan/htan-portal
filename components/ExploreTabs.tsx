import { observer } from 'mobx-react';
import { NextRouter } from 'next/router';
import React from 'react';

import { Atlas, Entity, setTab } from '../lib/helpers';
import { WPAtlas } from '../types';
import BiospecimenTable from './BiospecimenTable';
import CaseTable from './CaseTable';
import FileTable from './FileTable';
import WPAtlasTable from './WPAtlasTable';
import { DataSchemaData } from '../lib/dataSchemaHelpers';

interface IExploreTabsProps {
    router: NextRouter;
    filteredFiles: Entity[];
    samples: Entity[];
    cases: Entity[];
    wpData: WPAtlas[];
    schemaDataById?: { [schemaDataId: string]: DataSchemaData };
    getGroupsByPropertyFiltered: any;
    filteredSynapseAtlases: Atlas[];
    filteredSynapseAtlasesByNonAtlasFilters: Atlas[];
    selectedSynapseAtlases: Atlas[];
    allSynapseAtlases: Atlas[];
    onSelectAtlas?: (selected: Atlas[]) => void;
}

export enum ExploreTab {
    FILE = 'file',
    ATLAS = 'atlas',
    BIOSPECIMEN = 'biospecimen',
    CASES = 'cases',
}

const ExploreTabs: React.FunctionComponent<IExploreTabsProps> = observer(
    (props) => {
        const activeTab = props.router.query.tab || ExploreTab.ATLAS;

        return (
            <>
                <div className="subnav">
                    <ul className="nav nav-tabs">
                        <li className="nav-item">
                            <a
                                onClick={() =>
                                    setTab(ExploreTab.ATLAS, props.router)
                                }
                                className={`nav-link ${
                                    activeTab === ExploreTab.ATLAS
                                        ? 'active'
                                        : ''
                                }`}
                            >
                                Atlases
                            </a>
                        </li>
                        <li className="nav-item">
                            <a
                                onClick={() =>
                                    setTab(ExploreTab.CASES, props.router)
                                }
                                className={`nav-link ${
                                    activeTab === ExploreTab.CASES
                                        ? 'active'
                                        : ''
                                }`}
                            >
                                Cases
                            </a>
                        </li>
                        <li className="nav-item">
                            <a
                                onClick={() =>
                                    setTab(ExploreTab.BIOSPECIMEN, props.router)
                                }
                                className={`nav-link ${
                                    activeTab === ExploreTab.BIOSPECIMEN
                                        ? 'active'
                                        : ''
                                }`}
                            >
                                Biospecimens
                            </a>
                        </li>
                        <li className="nav-item">
                            <a
                                onClick={() =>
                                    setTab(ExploreTab.FILE, props.router)
                                }
                                className={`nav-link ${
                                    activeTab === ExploreTab.FILE
                                        ? 'active'
                                        : ''
                                }`}
                            >
                                Files
                            </a>
                        </li>
                    </ul>
                </div>

                <div
                    className={`tab-content fileTab ${
                        activeTab !== 'file' ? 'd-none' : ''
                    }`}
                >
                    <FileTable
                        entities={props.filteredFiles}
                        getGroupsByPropertyFiltered={
                            props.getGroupsByPropertyFiltered
                        }
                        patientCount={props.cases.length}
                    />
                </div>

                <div
                    className={`tab-content biospecimen ${
                        activeTab !== ExploreTab.BIOSPECIMEN ? 'd-none' : ''
                    }`}
                >
                    <BiospecimenTable
                        synapseAtlases={props.filteredSynapseAtlases}
                        samples={props.samples}
                        schemaDataById={props.schemaDataById}
                    />
                </div>

                <div
                    className={`tab-content cases ${
                        activeTab !== ExploreTab.CASES ? 'd-none' : ''
                    }`}
                >
                    <CaseTable
                        synapseAtlases={props.filteredSynapseAtlases}
                        cases={props.cases}
                        schemaDataById={props.schemaDataById}
                    />
                </div>

                <div
                    className={`tab-content atlasTab ${
                        activeTab !== 'atlas' ? 'd-none' : ''
                    }`}
                >
                    <WPAtlasTable
                        router={props.router}
                        synapseAtlasData={props.allSynapseAtlases}
                        selectedAtlases={props.selectedSynapseAtlases}
                        filteredAtlases={
                            props.filteredSynapseAtlasesByNonAtlasFilters
                        }
                        onSelectAtlas={props.onSelectAtlas}
                    />
                </div>
            </>
        );
    }
);

export default ExploreTabs;
