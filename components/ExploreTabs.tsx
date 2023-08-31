import { observer, useLocalStore } from 'mobx-react';
import { NextRouter } from 'next/router';
import React, { useEffect, useMemo, useState } from 'react';

import { Atlas, Entity, isReleaseQCEnabled, setTab } from '../lib/helpers';
import BiospecimenTable from './BiospecimenTable';
import CaseTable from './CaseTable';
import FileTable from './FileTable';
import AtlasTable from './AtlasTable';
import { DataSchemaData } from '../lib/dataSchemaHelpers';
import { GenericAttributeNames } from '../lib/types';
import Plots from './Plots';
import {
    computeEntityReportByAssay,
    computeEntityReportByOrgan,
    computeEntityReportGeneralized,
} from '../lib/entityReportHelpers';
import Select from 'react-select';
import SummaryChart from './SummaryChart';
import { ScalePropType } from 'victory-core';
import _ from 'lodash';

import { ISelectedFiltersByAttrName } from '../packages/data-portal-filter/src/libs/types';

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
    wpData: WPAtlas[];
    schemaDataById?: { [schemaDataId: string]: DataSchemaData };
    groupsByPropertyFiltered: {
        [attrName: string]: { [attrValue: string]: Entity[] };
    };
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

enum PlotMode {
    SAMPLE = 'SAMPLE',
    CASE = 'CASE',
}

type IExploreTabsState = {
    selectedField: any;
    xaxis: any;
    mode: () => PlotMode;
};

const ExploreTabs: React.FunctionComponent<IExploreTabsProps> = observer(
    (props) => {
        const activeTab = props.router.query.tab || ExploreTab.ATLAS;

        const samplesByCaseId = useMemo(() => {
            return _.groupBy(props.filteredSamples, (s) => s.HTANParticipantID);
        }, [props.filteredSamples]);

        let options = _.map(props.groupsByPropertyFiltered, (value, key) => {
            return {
                value: key,
                label: key
                    .replace(/[A-Z]/g, (s) => ` ${s}`)
                    .replace(/of|or/g, (s) => ` ${s}`)
                    .replace(/$./, (s) => s.toUpperCase()),
            };
        });

        // let options = _.map(props.groupsByPropertyFiltered,(value, key)=>{
        //     return {
        //         value:key,
        //         label:key.replace(/[A-Z]/g,(s)=>` ${s}`)
        //             .replace(/of|or/g,(s)=>` ${s}`)
        //             .replace(/$./,(s)=>s.toUpperCase())
        //     }
        // });

        const xaxisOptions = [
            { value: 'HTANParticipantID', label: 'Case Count' },
            { value: 'HTANBiospecimenID', label: 'Specimen Count' },
        ];

        const myStore = useLocalStore<IExploreTabsState>(() => {
            return {
                selectedField: options[0],
                xaxis: xaxisOptions[0],
                mode() {
                    return this.xaxis.value === 'HTANParticipantID'
                        ? PlotMode.CASE
                        : PlotMode.SAMPLE;
                },
            };
        });

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
                        {isReleaseQCEnabled() && (
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
                                    Plots
                                </a>
                            </li>
                        )}
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

                {activeTab === ExploreTab.PLOTS && isReleaseQCEnabled() && (
                    <div
                        className={`tab-content fileTab ${
                            activeTab !== ExploreTab.PLOTS ? 'd-none' : ''
                        }`}
                    >
                        <div style={{ display: 'flex' }}>
                            <div style={{ width: 300, marginRight: 10 }}>
                                <Select
                                    classNamePrefix={'react-select'}
                                    isSearchable={false}
                                    isClearable={false}
                                    name={'field'}
                                    controlShouldRenderValue={true}
                                    options={options}
                                    defaultValue={options[0]}
                                    hideSelectedOptions={false}
                                    closeMenuOnSelect={true}
                                    onChange={(e) => {
                                        myStore.selectedField = e;
                                    }}
                                />
                            </div>
                            <div style={{ width: 300 }}>
                                <Select
                                    classNamePrefix={'react-select'}
                                    isSearchable={false}
                                    isClearable={false}
                                    name={'xaxis'}
                                    controlShouldRenderValue={true}
                                    options={xaxisOptions}
                                    hideSelectedOptions={false}
                                    closeMenuOnSelect={true}
                                    onChange={(e) => {
                                        myStore.xaxis = e?.value;
                                    }}
                                    defaultValue={xaxisOptions[0]}
                                />
                            </div>
                        </div>

                        {/*<Plots*/}
                        {/*    summaryDataDescriptor={'Your selection'}*/}
                        {/*    organSummary={computeEntityReportGeneralized(*/}
                        {/*        props.filteredFiles,*/}
                        {/*        myStore.selectedField.value,*/}
                        {/*    )}*/}
                        {/*    assaySummary={computeEntityReportByAssay(*/}
                        {/*        props.filteredFiles*/}
                        {/*    )}*/}
                        {/*/>*/}

                        <SummaryChart
                            data={computeEntityReportGeneralized(
                                props.filteredCases,
                                myStore.selectedField.value,
                                (d) => d['HTANParticipantID'],
                                (entities) => {
                                    if (
                                        myStore.xaxis.value !==
                                        'HTANParticipantID'
                                    ) {
                                        return _.sumBy(entities, (entity) => {
                                            return (
                                                samplesByCaseId?.[
                                                    entity.HTANParticipantID
                                                ].length || 0
                                            );
                                        });
                                    } else {
                                        return entities.length;
                                    }
                                }
                            )}
                            dependentAxisEntityName="Case"
                            stackedByCenter={false}
                            scale={{
                                x: 'linear',
                                y: 'log',
                            }}
                            minDomain={{ y: 0.95 }}
                            dependentAxisTickFormat={(t: number) => {
                                // only show tick labels for the integer powers of 10
                                return _.isInteger(Math.log10(t)) ? t : '';
                            }}
                            tooltipContent={(datum) => {
                                return (
                                    <div style={{ margin: 10 }}>{`${
                                        datum.totalCount
                                    } ${myStore.mode().toLowerCase()}s`}</div>
                                );
                            }}
                        />
                    </div>
                )}
            </>
        );
    }
);

export default ExploreTabs;
