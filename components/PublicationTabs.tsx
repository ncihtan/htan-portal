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

const toolsContent: { [id: string]: JSX.Element } = {
    htapp_crc_pelka_2021: <></>,
    duke_brca_risom_2021: (
        <>
            <h3>{`Explore Autominerva`}</h3>
            <br />
            <Tooltip overlay={`Click to Explore Autominerva`}>
                <a
                    href={
                        typeof window !== 'undefined'
                            ? `//${window.location.host}/explore?selectedFilters=%5B%7B%22value%22%3A%22mIHC%22%2C%22label%22%3A%22mIHC%22%2C%22group%22%3A%22assayName%22%2C%22count%22%3A62%2C%22isSelected%22%3Afalse%7D%2C%7B%22value%22%3A%22t-CyCIF%22%2C%22label%22%3A%22t-CyCIF%22%2C%22group%22%3A%22assayName%22%2C%22count%22%3A400%2C%22isSelected%22%3Afalse%7D%2C%7B%22value%22%3A%22MIBI%22%2C%22label%22%3A%22MIBI%22%2C%22group%22%3A%22assayName%22%2C%22count%22%3A165%2C%22isSelected%22%3Afalse%7D%2C%7B%22value%22%3A%22IMC%22%2C%22label%22%3A%22IMC%22%2C%22group%22%3A%22assayName%22%2C%22count%22%3A41%2C%22isSelected%22%3Afalse%7D%2C%7B%22value%22%3A%22H%26E%22%2C%22label%22%3A%22H%26E%22%2C%22group%22%3A%22assayName%22%2C%22count%22%3A254%2C%22isSelected%22%3Afalse%7D%2C%7B%22value%22%3A%22CyCIF%22%2C%22label%22%3A%22CyCIF%22%2C%22group%22%3A%22assayName%22%2C%22count%22%3A13%2C%22isSelected%22%3Afalse%7D%2C%7B%22group%22%3A%22AtlasName%22%2C%22value%22%3A%22HTAN+Duke%22%7D%5D&tab=file`
                            : ''
                    }
                    target="_blank"
                >
                    <img
                        style={{ width: '60%' }}
                        src={'/HTA6_Duke_tool_example.png'}
                    />
                </a>
            </Tooltip>
        </>
    ),
    hms_ckcm_nirmal_2022: (
        <>
            <h3>{`Explore Autominerva`}</h3>
            <br />
            <Tooltip overlay={`Click to Explore Autominerva`}>
                <a
                    href={
                        typeof window !== 'undefined'
                            ? `//${window.location.host}/explore?selectedFilters=%5B%7B%22group%22%3A%22AtlasName%22%2C%22value%22%3A%22HTAN+HMS%22%7D%2C%7B%22value%22%3A%22OME-TIFF%22%2C%22label%22%3A%22OME-TIFF%22%2C%22group%22%3A%22FileFormat%22%2C%22count%22%3A16%2C%22isSelected%22%3Afalse%7D%5D&tab=file`
                            : ''
                    }
                    target="_blank"
                >
                    <img
                        style={{ width: '60%' }}
                        src={'/HTA6_Duke_tool_example.png'}
                    />
                </a>
            </Tooltip>
        </>
    ),
    ohsu_brca_johnson_2022: (
        <>
            <h3>{`Explore Case HTA9_1 in cBioPortal`}</h3>
            The <a href="https://www.cbioportal.org/">cBioPortal</a> for Cancer
            Genomics is an open-source software platform that enables
            interactive, exploratory analysis of large-scale cancer genomics
            data sets with a biologist-friendly interface.
            <br />
            <Tooltip
                overlay={`Click to Explore the Clinicogenomic Profiling of Case HTA9_1 in detail in cBioPortal`}
            >
                <a
                    href={
                        'https://www.cbioportal.org/patient?studyId=ohsu_brca_johnson_2022&caseId=HTA9_1'
                    }
                    target="_blank"
                >
                    <img
                        style={{ width: '60%' }}
                        src={'/cbioportal_hta9_1_patient.png'}
                    />
                </a>
            </Tooltip>
            <br />
            <br />
            <br />
            <h3>
                {`Explore Case HTA9_1's Liver Metastatis Biopsy in Minerva`}
            </h3>
            <a href="https://www.cycif.org/software/minerva">Minerva</a>
            is a suite of software tools for interpreting and interacting with
            complex images, organized around a guided analysis approach.
            <br />
            <Tooltip
                overlay={`Click to Explore Case HTA9_1's Breast Cancer Liver Metastatis Biopsy in Minerva`}
            >
                <a
                    href={'https://minerva-story-htan-ohsu-demo.surge.sh/'}
                    target="_blank"
                >
                    <img
                        style={{ width: '60%' }}
                        src={'/minerva_hta9_patient.png'}
                    />
                </a>
            </Tooltip>
        </>
    ),
    msk_sclc_chan_2021: (
        <>
            <h3>{`Explore Cellxgene`}</h3>
            The <a href="https://cellxgene.cziscience.com/">cellxgene</a> is an
            interactive data explorer for single-cell datasets.
            <br />
            <Tooltip
                overlay={`Click to Explore the celllxgene collections page`}
            >
                <a
                    href={
                        'https://cellxgene.cziscience.com/collections/62e8f058-9c37-48bc-9200-e767f318a8ec'
                    }
                    target="_blank"
                >
                    <img
                        style={{ width: '60%' }}
                        src={'/HTA8_celllxgene_example.png'}
                    />
                </a>
            </Tooltip>
        </>
    ),
    vanderbilt_crc_chen_2021: (
        <>
            <h3>{`Explore Autominerva`}</h3>
            <br />
            <Tooltip overlay={`Click to Explore Autominerva`}>
                <a
                    href={
                        typeof window !== 'undefined'
                            ? `//${window.location.host}/explore?selectedFilters=%5B%7B%22value%22%3A%22H%26E%22%2C%22label%22%3A%22H%26E%22%2C%22group%22%3A%22assayName%22%2C%22count%22%3A692%2C%22isSelected%22%3Afalse%7D%2C%7B%22group%22%3A%22AtlasName%22%2C%22value%22%3A%22HTAN+Vanderbilt%22%7D%5D&tab=file`
                            : ''
                    }
                    target="_blank"
                >
                    <img
                        style={{ width: '60%' }}
                        src={'/HTA11_Vanderbilt_example.png'}
                    />
                </a>
            </Tooltip>
            <br />
            <br />
            <br />
            <h3>
                {`Explore in cellxgene (temporarily disabled: update pending)`}
            </h3>
        </>
    ),
};
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
                            {props.router.query.id ? (
                                toolsContent[props.router.query.id.toString()]
                            ) : (
                                <div />
                            )}
                        </div>
                    )}
                </div>
            </>
        );
    }
);

export default PublicationTabs;
