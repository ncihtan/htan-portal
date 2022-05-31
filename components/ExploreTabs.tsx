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
import {
    ExploreSelectedFilter,
    ISelectedFiltersByAttrName,
} from '../lib/types';

interface IExploreTabsProps {
    router: NextRouter;
    filteredFiles: Entity[];
    nonAtlasSelectedFiltersByAttrName: ISelectedFiltersByAttrName;
    samples: Entity[];
    cases: Entity[];
    filteredCasesByNonAtlasFilters: Entity[];
    filteredSamplesByNonAtlasFilters: Entity[];
    wpData: WPAtlas[];
    schemaDataById?: { [schemaDataId: string]: DataSchemaData };
    getGroupsByPropertyFiltered: any;
    filteredSynapseAtlases: Atlas[];
    filteredSynapseAtlasesByNonAtlasFilters: Atlas[];
    selectedSynapseAtlases: Atlas[];
    allSynapseAtlases: Atlas[];
    onSelectAtlas?: (selected: Atlas[]) => void;

    toggleShowAllBiospecimens: () => void;
    showAllBiospecimens: boolean;
    toggleShowAllCases: () => void;
    showAllCases: boolean;
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
                                Research Teams
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

                {activeTab === 'file' && (
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
                )}

                {activeTab === ExploreTab.BIOSPECIMEN && (
                    <div
                        className={`tab-content biospecimen ${
                            activeTab !== ExploreTab.BIOSPECIMEN ? 'd-none' : ''
                        }`}
                    >
                        {/*<label className="show-all-checkbox">
                            <input
                                type="checkbox"
                                checked={props.showAllBiospecimens}
                                onClick={props.toggleShowAllBiospecimens}
                            />
                            Show all biospecimens from filtered files
                        </label>*/}
                        <BiospecimenTable
                            synapseAtlases={props.filteredSynapseAtlases}
                            samples={props.samples}
                            schemaDataById={props.schemaDataById}
                        />
                    </div>
                )}

                {activeTab === ExploreTab.CASES && (
                    <div
                        className={`tab-content cases ${
                            activeTab !== ExploreTab.CASES ? 'd-none' : ''
                        }`}
                    >
                        {/*<label className="show-all-checkbox">
                            <input
                                type="checkbox"
                                checked={props.showAllCases}
                                onClick={props.toggleShowAllCases}
                            />
                            Show all cases from filtered files
                        </label>*/}
                        <CaseTable
                            synapseAtlases={props.filteredSynapseAtlases}
                            cases={props.cases}
                            schemaDataById={props.schemaDataById}
                        />
                    </div>
                )}

                {activeTab === 'atlas' && (
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
                            filteredCases={props.filteredCasesByNonAtlasFilters}
                            filteredBiospecimens={
                                props.filteredSamplesByNonAtlasFilters
                            }
                            selectedFiltersByAttrName={
                                props.nonAtlasSelectedFiltersByAttrName
                            }
                        />
                    </div>
                )}
            </>
        );
    }
);

export default ExploreTabs;
