import { observer, useLocalStore } from 'mobx-react';
import { NextRouter } from 'next/router';
import React, { useEffect, useMemo, useState } from 'react';

import { Atlas, Entity, isReleaseQCEnabled, setTab } from '../lib/helpers';
import BiospecimenTable from './BiospecimenTable';
import CaseTable from './CaseTable';
import FileTable from './FileTable';
import AtlasTable from './AtlasTable';
import { DataSchemaData } from '../lib/dataSchemaHelpers';
import { AttributeNames, GenericAttributeNames } from '../lib/types';
import Plots from './Plots';
import {
    computeEntityReportByAssay,
    computeEntityReportByOrgan,
    computeEntityReportGeneralized,
    getNormalizedOrgan,
} from '../lib/entityReportHelpers';
import Select from 'react-select';
import SummaryChart from './SummaryChart';
import {
    ScalePropType,
    VictoryContainer,
    VictoryLabel,
    VictoryTheme,
} from 'victory-core';
import _ from 'lodash';

import { ISelectedFiltersByAttrName } from '../packages/data-portal-filter/src/libs/types';
import Alert from 'react-bootstrap/Alert';
import { VictoryChart } from 'victory-chart';
import { VictoryBar } from 'victory-bar';
import { VictoryAxis } from 'victory-axis';
import ExplorePlot from './ExplorePlot';
import { log } from 'util';

interface IExploreTabsProps {
    router: NextRouter;
    files: Entity[];
    filteredFiles: Entity[];
    nonAtlasSelectedFiltersByAttrName: ISelectedFiltersByAttrName;
    samples: Entity[];
    cases: Entity[];
    filteredCasesByNonAtlasFilters: Entity[];
    filteredSamplesByNonAtlasFilters: Entity[];
    filteredCases: Entity[];
    filteredSamples: Entity[];
    schemaDataById?: { [schemaDataId: string]: DataSchemaData };
    groupsByPropertyFiltered: Record<string, Entity[]>;
    filteredSynapseAtlases: Atlas[];
    filteredSynapseAtlasesByNonAtlasFilters: Atlas[];
    selectedSynapseAtlases: Atlas[];
    allSynapseAtlases: Atlas[];
    onSelectAtlas?: (selected: Atlas[]) => void;

    toggleShowAllBiospecimens: () => void;
    showAllBiospecimens: boolean;
    toggleShowAllCases: () => void;
    showAllCases: boolean;

    genericAttributeMap?: { [attr: string]: GenericAttributeNames };
}

export enum ExploreTab {
    FILE = 'file',
    ATLAS = 'atlas',
    BIOSPECIMEN = 'biospecimen',
    CASES = 'cases',
    PLOTS = 'plots',
}

enum EntityType {
    SAMPLE = 'SAMPLE',
    CASE = 'CASE',
}

const metricTypes = [
    { value: 'ParticipantID', label: 'Case Count' },
    { value: 'BiospecimenID', label: 'Specimen Count' },
];

const ExploreTabs: React.FunctionComponent<IExploreTabsProps> = observer(
    (props) => {
        const activeTab = props.router.query.tab || ExploreTab.ATLAS;

        const [logScale, setLogScale] = useState(false);

        const [metric, setMetric] = useState(metricTypes[0]);

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
                        {
                            <li className="nav-item">
                                <a
                                    onClick={() =>
                                        setTab(ExploreTab.PLOTS, props.router)
                                    }
                                    className={`nav-link ${
                                        activeTab === ExploreTab.PLOTS
                                            ? 'active'
                                            : ''
                                    }`}
                                >
                                    Plots{' '}
                                    <span style={{ color: 'orange' }}>
                                        Beta!
                                    </span>
                                </a>
                            </li>
                        }
                    </ul>
                </div>

                {activeTab === ExploreTab.FILE && (
                    <div
                        className={`tab-content fileTab ${
                            activeTab !== ExploreTab.FILE ? 'd-none' : ''
                        }`}
                    >
                        <FileTable
                            entities={props.filteredFiles}
                            groupsByPropertyFiltered={
                                props.groupsByPropertyFiltered
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
                            genericAttributeMap={props.genericAttributeMap}
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
                            genericAttributeMap={props.genericAttributeMap}
                        />
                    </div>
                )}

                {activeTab === ExploreTab.ATLAS && (
                    <div
                        className={`tab-content atlasTab ${
                            activeTab !== ExploreTab.ATLAS ? 'd-none' : ''
                        }`}
                    >
                        <AtlasTable
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
                            files={props.files}
                            filteredFiles={props.filteredFiles}
                        />
                    </div>
                )}

                {activeTab === ExploreTab.PLOTS && (
                    <div
                        className={`tab-content fileTab ${
                            activeTab !== ExploreTab.PLOTS ? 'd-none' : ''
                        }`}
                    >
                        <div className={'alert alert-warning'}>
                            This feature is in beta.
                        </div>

                        <Select
                            classNamePrefix={'react-select'}
                            isSearchable={false}
                            isClearable={false}
                            name={'xaxis'}
                            controlShouldRenderValue={true}
                            options={metricTypes}
                            hideSelectedOptions={false}
                            closeMenuOnSelect={true}
                            onChange={(e) => {
                                setMetric(e!);
                            }}
                            value={metric}
                        />

                        <div className="form-check">
                            <input
                                className="form-check-input"
                                type="checkbox"
                                checked={logScale}
                                onChange={(e) => setLogScale(!logScale)}
                            />
                            <label className="form-check-label">Log</label>
                        </div>

                        {props.filteredCases.length && (
                            <div className={'d-flex'}>
                                <ExplorePlot
                                    selectedField={{
                                        value: 'TissueorOrganofOrigin',
                                        label: 'Organ',
                                        data: { type: 'CASE' },
                                    }}
                                    filteredCases={props.filteredCases}
                                    filteredSamples={props.filteredSamples}
                                    hideSelectors={true}
                                    normalizersByField={{
                                        TissueorOrganofOrigin: (e: Entity) =>
                                            getNormalizedOrgan(e),
                                    }}
                                    title={'Organs'}
                                    width={500}
                                    logScale={logScale}
                                    metricType={metric}
                                />
                                <ExplorePlot
                                    title={'Assays'}
                                    selectedField={{
                                        data: { type: 'SAMPLE' },
                                        label: 'Assay',
                                        value: 'assayName',
                                    }}
                                    width={500}
                                    filteredCases={props.filteredCases}
                                    filteredSamples={props.filteredFiles}
                                    hideSelectors={true}
                                    logScale={logScale}
                                    metricType={metric}
                                />
                            </div>
                        )}

                        {props.filteredCases.length && (
                            <ExplorePlot
                                filteredCases={props.filteredCases}
                                filteredSamples={props.filteredSamples}
                                logScale={logScale}
                                metricType={metric}
                            />
                        )}
                    </div>
                )}
            </>
        );
    }
);

export default ExploreTabs;
