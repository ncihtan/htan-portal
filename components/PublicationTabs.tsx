import { observer } from 'mobx-react';
import { NextRouter } from 'next/router';
import Tooltip from 'rc-tooltip';
import React from 'react';
import BiospecimenTable from './BiospecimenTable';
import CaseTable from './CaseTable';
import FileTable from './FileTable';
import { DataSchemaData } from '../lib/dataSchemaHelpers';
import { groupFilesByAttrNameAndValue } from '../lib/filterHelpers';
import { Atlas, Entity, setTab } from '../lib/helpers';
import styles from './PublicationTabs.module.scss';

interface IPublicationTabsProps {
    router: NextRouter;
    abstract: string;
    synapseAtlas: Atlas;
    biospecimens: Entity[];
    cases: Entity[];
    images: Entity[];
    sequences: Entity[];
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

// TODO: move this to utils
// Replace the one in WPAtlasTable.tsx
const CBioPortalViewerLink = (props: { url: string; count: number }) => (
    <Tooltip overlay="cBioPortal">
        <a
            href={props.url}
            target="_blank"
            style={{
                paddingRight: 8,
                fontFamily: 'monospace',
                textDecoration: 'none',
            }}
        >
            {props.count < 100 && '\u00A0'}
            {props.count < 10 && '\u00A0'}
            {props.count}{' '}
            <img
                width={20}
                src={'https://avatars.githubusercontent.com/u/9876251?s=20&v=4'}
            />
        </a>
    </Tooltip>
);

// TODO: move this to utils
// Replace the one in WPAtlasTable.tsx
const CellxgeneViewerLink = (props: { url: string; count: number }) => (
    <Tooltip overlay="cellxgene">
        <a
            href={props.url}
            target="_blank"
            style={{
                paddingRight: 8,
                fontFamily: 'monospace',
                textDecoration: 'none',
            }}
        >
            {props.count < 100 && '\u00A0'}
            {props.count < 10 && '\u00A0'}
            {props.count}{' '}
            <img
                width={20}
                src={
                    'https://pbs.twimg.com/profile_images/1285714433981812736/-wuBO62N_400x400.jpg'
                }
            />
        </a>
    </Tooltip>
);

// TODO: move this to utils
// Replace the one in WPAtlasTable.tsx
const MinervaStoryViewerLink = (props: { url: string; count: number }) => (
    <Tooltip overlay="Minerva Story">
        <a
            href={props.url}
            target="_blank"
            style={{
                paddingRight: 8,
                fontFamily: 'monospace',
                textDecoration: 'none',
            }}
        >
            {props.count < 100 && '\u00A0'}
            {props.count < 10 && '\u00A0'}
            {props.count}{' '}
            <img
                width={20}
                src="https://user-images.githubusercontent.com/1334004/156241219-a3062991-ba9d-4201-ad87-3c9c1f0c61d8.png"
            />
        </a>
    </Tooltip>
);

// TODO: move this to utils
// Replace the one in WPAtlasTable.tsx
const AutoMinervaViewerLink = (props: { url: string; count: number }) => (
    <Tooltip overlay="Autominerva">
        <a
            href={props.url}
            style={{
                paddingRight: 8,
                fontFamily: 'monospace',
                textDecoration: 'none',
            }}
        >
            {props.count < 100 && '\u00A0'}
            {props.count < 10 && '\u00A0'}
            {props.count}{' '}
            <img
                width={20}
                src="https://user-images.githubusercontent.com/1334004/159789346-b647c772-48fe-4652-8d2b-3eecf6690f1f.png"
            />
        </a>
    </Tooltip>
);

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
                        {/* <li className="nav-item">
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
                        </li> */}
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

                    {activeTab === PublicationTab.PARTICIPANTS && (
                        <div
                            className={`tab-content cases ${
                                activeTab !== PublicationTab.PARTICIPANTS
                                    ? 'd-none'
                                    : ''
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
                                synapseAtlases={[props.synapseAtlas]}
                                cases={props.cases}
                                schemaDataById={props.schemaDataById}
                                excludedColumns={[
                                    'DaystoLastFollowup',
                                    'VitalStatus',
                                ]}
                            />
                        </div>
                    )}

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
                                samples={props.biospecimens}
                                schemaDataById={props.schemaDataById}
                            />
                        </div>
                    )}

                    {activeTab === PublicationTab.IMAGING && (
                        <div
                            className={`tab-content fileTab ${
                                activeTab !== PublicationTab.IMAGING
                                    ? 'd-none'
                                    : ''
                            }`}
                        >
                            <FileTable
                                entities={props.images}
                                getGroupsByPropertyFiltered={groupFilesByAttrNameAndValue(
                                    props.images
                                )}
                                patientCount={props.cases.length}
                            />
                        </div>
                    )}

                    {activeTab === PublicationTab.SEQUENCING && (
                        <div
                            className={`tab-content fileTab ${
                                activeTab !== PublicationTab.SEQUENCING
                                    ? 'd-none'
                                    : ''
                            }`}
                        >
                            <FileTable
                                entities={props.sequences}
                                getGroupsByPropertyFiltered={groupFilesByAttrNameAndValue(
                                    props.sequences
                                )}
                                patientCount={props.cases.length}
                            />
                        </div>
                    )}

                    {activeTab === PublicationTab.TOOLS && (
                        <div
                            className={`tab-content fileTab ${
                                activeTab !== PublicationTab.TOOLS
                                    ? 'd-none'
                                    : ''
                            }`}
                        >
                            <h3>cBioPortal</h3>
                            The{' '}
                            <a href="https://www.cbioportal.org/">
                                cBioPortal
                            </a>{' '}
                            for Cancer Genomics is an open-source software
                            platform that enables interactive, exploratory
                            analysis of large-scale cancer genomics data sets
                            with a biologist-friendly interface. Click{' '}
                            <a href="https://www.cbioportal.org/patient?studyId=brca_hta9_htan_2022&caseId=HTA9_1">
                                here
                            </a>{' '}
                            to view patient from cBioPortal.
                            <br />
                            <img
                                style={{ width: '60%' }}
                                src={'/cbioportal_hta9_1_patient.png'}
                            />
                            <h3>Minerva Story</h3>
                            Minervais a suite of software tools for interpreting
                            and interacting with complex images, organized
                            around a guided analysis approach. Click{' '}
                            <a href="https://minerva-story-htan-ohsu-demo.surge.sh/">
                                here
                            </a>{' '}
                            to view patient from Minerva.
                            <br />
                            <img
                                style={{ width: '60%' }}
                                src={'/minerva_hta9_patient.png'}
                            />
                        </div>
                    )}
                </div>
            </>
        );
    }
);

export default PublicationTabs;
