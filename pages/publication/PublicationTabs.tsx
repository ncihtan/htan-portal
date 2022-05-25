import { observer } from 'mobx-react';
import { NextRouter } from 'next/router';
import React from 'react';
import BiospecimenTable from '../../components/BiospecimenTable';
import { DataSchemaData } from '../../lib/dataSchemaHelpers';
import { Atlas, Entity, setTab } from '../../lib/helpers';
import styles from './styles.module.scss';

interface IPublicationTabsProps {
    router: NextRouter;
    abstract: string;
    synapseAtlas: Atlas;
    bopspeciments: Entity[];
    schemaDataById: {
        [schemaDataId: string]: DataSchemaData;
    };
    // filteredFiles: Entity[];
    // nonAtlasSelectedFiltersByAttrName: ISelectedFiltersByAttrName;
    // samples: Entity[];
    // cases: Entity[];
    // filteredCasesByNonAtlasFilters: Entity[];
    // filteredSamplesByNonAtlasFilters: Entity[];
    // wpData: WPAtlas[];
    // schemaDataById?: { [schemaDataId: string]: DataSchemaData };
    // getGroupsByPropertyFiltered: any;
    // filteredSynapseAtlases: Atlas[];
    // filteredSynapseAtlasesByNonAtlasFilters: Atlas[];
    // selectedSynapseAtlases: Atlas[];
    // allSynapseAtlases: Atlas[];
    // onSelectAtlas?: (selected: Atlas[]) => void;

    // toggleShowAllBiospecimens: () => void;
    // showAllBiospecimens: boolean;
    // toggleShowAllCases: () => void;
    // showAllCases: boolean;
}

export enum PublicationTab {
    ABSTRACT = 'abstract',
    DATASETS = 'datasets',
    PARTICIPANTS = 'participants',
    BIOSPECIMENS = 'biospecimens',
    IMAGING = 'imaging',
    SEQUENCING = 'sequencing',
    TOOLS = 'tools',
}

const PublicationTabs: React.FunctionComponent<IPublicationTabsProps> = observer(
    (props) => {
        const activeTab = props.router.query.tab || PublicationTab.ABSTRACT;

        return (
            <>
                <div className="subnav">
                    <ul className="nav nav-tabs">
                        <li className="nav-item">
                            <a
                                onClick={() =>
                                    setTab(
                                        PublicationTab.ABSTRACT,
                                        props.router
                                    )
                                }
                                className={`nav-link ${
                                    activeTab === PublicationTab.ABSTRACT
                                        ? 'active'
                                        : ''
                                }`}
                            >
                                Abstract
                            </a>
                        </li>
                        <li className="nav-item">
                            <a
                                onClick={() =>
                                    setTab(
                                        PublicationTab.DATASETS,
                                        props.router
                                    )
                                }
                                className={`nav-link ${
                                    activeTab === PublicationTab.DATASETS
                                        ? 'active'
                                        : ''
                                }`}
                            >
                                Datasets
                            </a>
                        </li>
                        <li className="nav-item">
                            <a
                                onClick={() =>
                                    setTab(
                                        PublicationTab.PARTICIPANTS,
                                        props.router
                                    )
                                }
                                className={`nav-link ${
                                    activeTab === PublicationTab.PARTICIPANTS
                                        ? 'active'
                                        : ''
                                }`}
                            >
                                Participants
                            </a>
                        </li>
                        <li className="nav-item">
                            <a
                                onClick={() =>
                                    setTab(
                                        PublicationTab.BIOSPECIMENS,
                                        props.router
                                    )
                                }
                                className={`nav-link ${
                                    activeTab === PublicationTab.BIOSPECIMENS
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
                                    setTab(PublicationTab.IMAGING, props.router)
                                }
                                className={`nav-link ${
                                    activeTab === PublicationTab.IMAGING
                                        ? 'active'
                                        : ''
                                }`}
                            >
                                Imaging Data
                            </a>
                        </li>
                        <li className="nav-item">
                            <a
                                onClick={() =>
                                    setTab(
                                        PublicationTab.SEQUENCING,
                                        props.router
                                    )
                                }
                                className={`nav-link ${
                                    activeTab === PublicationTab.SEQUENCING
                                        ? 'active'
                                        : ''
                                }`}
                            >
                                Sequencing
                            </a>
                        </li>
                        <li className="nav-item">
                            <a
                                onClick={() =>
                                    setTab(PublicationTab.TOOLS, props.router)
                                }
                                className={`nav-link ${
                                    activeTab === PublicationTab.TOOLS
                                        ? 'active'
                                        : ''
                                }`}
                            >
                                Tools
                            </a>
                        </li>
                    </ul>
                </div>

                <div className={styles.publicationTabContent}>
                    {activeTab === PublicationTab.ABSTRACT && (
                        <div
                            className={`tab-content fileTab ${
                                activeTab !== PublicationTab.ABSTRACT
                                    ? 'd-none'
                                    : ''
                            }`}
                        >
                            <p>{props.abstract}</p>
                        </div>
                    )}

                    {activeTab === PublicationTab.DATASETS && (
                        <div
                            className={`tab-content biospecimen ${
                                activeTab !== PublicationTab.DATASETS
                                    ? 'd-none'
                                    : ''
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
                        </div>
                    )}

                    {/* {activeTab === PublicationTab.CASES && (
                    <div
                        className={`tab-content cases ${
                            activeTab !== PublicationTab.CASES ? 'd-none' : ''
                        }`}
                    > */}
                    {/*<label className="show-all-checkbox">
                            <input
                                type="checkbox"
                                checked={props.showAllCases}
                                onClick={props.toggleShowAllCases}
                            />
                            Show all cases from filtered files
                        </label>*/}
                    {/* <CaseTable
                            synapseAtlases={props.filteredSynapseAtlases}
                            cases={props.cases}
                            schemaDataById={props.schemaDataById}
                        />
                    </div>
                )} */}

                    {activeTab === PublicationTab.BIOSPECIMENS && (
                        <div
                            className={`tab-content biospecimen ${
                                activeTab !== PublicationTab.BIOSPECIMENS
                                    ? 'd-none'
                                    : ''
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
                                synapseAtlases={[props.synapseAtlas]}
                                samples={props.bopspeciments}
                                schemaDataById={props.schemaDataById}
                            />
                        </div>
                    )}

                    {/* {activeTab === PublicationTab.ABSTRACT && (
                    <div
                        className={`tab-content fileTab ${
                            activeTab !== PublicationTab.ABSTRACT ? 'd-none' : ''
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
                )} */}
                </div>
            </>
        );
    }
);

export default PublicationTabs;
