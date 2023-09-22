import { observer } from 'mobx-react';
import { NextRouter } from 'next/router';
import React, { useState } from 'react';

import { setTab } from '../lib/helpers';
import FileTable from './FileTable';
import { getNormalizedOrgan } from '../lib/entityReportHelpers';
import Select, { MultiValueProps } from 'react-select';
import _ from 'lodash';

import { ISelectedFiltersByAttrName } from '../packages/data-portal-filter/src/libs/types';
import ExplorePlot, { DEFAULT_EXPLORE_PLOT_OPTIONS } from './ExplorePlot';
import { GenericAttributeNames } from '../packages/data-portal-utils/src/libs/types';
import { Atlas, Entity } from '../packages/data-portal-commons/src/libs/entity';
import { DataSchemaData } from '../packages/data-portal-schema/src/libs/dataSchemaHelpers';
import AtlasTable from '../packages/data-portal-explore/src/components/AtlasTable';
import BiospecimenTable from '../packages/data-portal-explore/src/components/BiospecimenTable';
import CaseTable from '../packages/data-portal-explore/src/components/CaseTable';
import { ExploreTab } from '../packages/data-portal-explore/src/libs/types';
import { PublicationPageLink, PUBLICATIONS } from '../lib/publications';
import getAtlasMetaData from '../lib/getAtlasMetaData';

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

const metricTypes = [
    { value: 'ParticipantID', label: 'Case Count' },
    { value: 'BiospecimenID', label: 'Specimen Count' },
];

const MultiValue = (props: MultiValueProps<any>) => {
    const indexInSelection = props.selectProps.value.indexOf(props.data);
    if (indexInSelection === 0) {
        const moreCountLanguage =
            props.selectProps.value.length > 1
                ? ` + ${props.selectProps.value.length - 1} more`
                : '';
        return (
            <span>
                {props.data.label}
                {moreCountLanguage}
            </span>
        );
    } else {
        return <></>;
    }
};

function getSamplesByValueMap(
    entities: Entity[],
    countByField: string
): Record<string, Entity[]> {
    const ret = entities.reduce((agg: Record<string, Entity[]>, file) => {
        if (file.assayName) {
            agg[file.assayName] = agg[file.assayName] || [];
            agg[file.assayName].push(...file.biospecimen);
        }
        return agg;
    }, {});

    return _.mapValues(ret, (v, k) =>
        _.uniqBy(v, (e) => e[countByField as keyof Entity])
    );
}

const ExploreTabs: React.FunctionComponent<IExploreTabsProps> = observer(
    (props) => {
        const activeTab = props.router.query.tab || ExploreTab.ATLAS;

        const [logScale, setLogScale] = useState(false);

        // TODO harmonization is not functional yet
        const [harmonize, setHarmonize] = useState(true);

        const [hideNA, setHideNA] = useState(false);

        const [metric, setMetric] = useState(metricTypes[0]);

        const [selectedFields, setSelectedFields] = useState(
            DEFAULT_EXPLORE_PLOT_OPTIONS.filter((opt) =>
                /TissueorOrganofOrigin|assayName/.test(opt.value)
            )
        );

        const normalizersByField = {
            TissueorOrganofOrigin: (e: Entity) => getNormalizedOrgan(e),
        };

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
                            setTab={(tab: ExploreTab) =>
                                setTab(tab, props.router)
                            }
                            publicationPageLink={PublicationPageLink}
                            publications={PUBLICATIONS}
                            getAtlasMetaData={getAtlasMetaData}
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

                        <form
                            className={'d-flex'}
                            style={{ alignItems: 'center' }}
                        >
                            <div style={{ width: 300, marginRight: 20 }}>
                                <Select
                                    classNamePrefix={'react-select'}
                                    isSearchable={false}
                                    isClearable={false}
                                    isMulti={true}
                                    name={'field'}
                                    components={{ MultiValue }}
                                    controlShouldRenderValue={true}
                                    options={DEFAULT_EXPLORE_PLOT_OPTIONS}
                                    defaultValue={selectedFields}
                                    hideSelectedOptions={false}
                                    closeMenuOnSelect={false}
                                    onChange={(e) => {
                                        setSelectedFields(e as any);
                                    }}
                                />
                            </div>

                            <div style={{ width: 300, marginRight: 20 }}>
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
                            </div>
                            <div style={{ marginRight: 20 }}>
                                <div className="form-check">
                                    <input
                                        className="form-check-input"
                                        type="checkbox"
                                        checked={logScale}
                                        onChange={() => setLogScale(!logScale)}
                                    />
                                    <label className="form-check-label">
                                        Log
                                    </label>
                                </div>
                            </div>

                            <div style={{ marginRight: 20 }}>
                                <div className="form-check">
                                    <input
                                        className="form-check-input"
                                        type="checkbox"
                                        checked={hideNA}
                                        onChange={() => setHideNA(!hideNA)}
                                    />
                                    <label className="form-check-label">
                                        Hide NA
                                    </label>
                                </div>
                            </div>

                            {/*<div>*/}
                            {/*    <div className="form-check">*/}
                            {/*        <input*/}
                            {/*            className="form-check-input"*/}
                            {/*            type="checkbox"*/}
                            {/*            checked={harmonize}*/}
                            {/*            onChange={() =>*/}
                            {/*                setHarmonize(!harmonize)*/}
                            {/*            }*/}
                            {/*        />*/}
                            {/*        <label className="form-check-label">*/}
                            {/*            Harmonize data*/}
                            {/*        </label>*/}
                            {/*    </div>*/}
                            {/*</div>*/}
                        </form>

                        {/*{props.filteredCases.length &&*/}
                        {/*    selectedFields.value === 'Summary' && (*/}
                        {/*        <div className={'d-flex'}>*/}
                        {/*            <ExplorePlot*/}
                        {/*                selectedField={{*/}
                        {/*                    value: 'TissueorOrganofOrigin',*/}
                        {/*                    label: 'Organ',*/}
                        {/*                    data: { type: 'CASE' },*/}
                        {/*                }}*/}
                        {/*                filteredCases={props.filteredCases}*/}
                        {/*                filteredSamples={props.filteredSamples}*/}
                        {/*                normalizersByField={{*/}
                        {/*                    TissueorOrganofOrigin: (*/}
                        {/*                        e: Entity*/}
                        {/*                    ) => getNormalizedOrgan(e),*/}
                        {/*                }}*/}
                        {/*                title={'Organs'}*/}
                        {/*                width={500}*/}
                        {/*                logScale={logScale}*/}
                        {/*                metricType={metric}*/}
                        {/*                hideNA={hideNA}*/}
                        {/*            />*/}
                        {/*            <ExplorePlot*/}
                        {/*                title={'Assays'}*/}
                        {/*                selectedField={{*/}
                        {/*                    data: { type: 'SAMPLE' },*/}
                        {/*                    label: 'Assay',*/}
                        {/*                    value: 'assayName',*/}
                        {/*                }}*/}
                        {/*                width={500}*/}
                        {/*                filteredCases={props.filteredCases}*/}
                        {/*                filteredSamples={props.filteredFiles}*/}
                        {/*                logScale={logScale}*/}
                        {/*                metricType={metric}*/}
                        {/*                samplesByValueMap={getSamplesByValueMap(*/}
                        {/*                    props.filteredFiles,*/}
                        {/*                    metric.value*/}
                        {/*                )}*/}
                        {/*                hideNA={hideNA}*/}
                        {/*            />*/}
                        {/*        </div>*/}
                        {/*    )}*/}
                        <div className={'d-flex flex-wrap'}>
                            {props.filteredCases.length &&
                                selectedFields.map((option) => {
                                    if (option.value === 'assayName') {
                                        return (
                                            <ExplorePlot
                                                selectedField={{
                                                    data: { type: 'SAMPLE' },
                                                    label: 'Assay',
                                                    value: 'assayName',
                                                }}
                                                width={500}
                                                filteredCases={
                                                    props.filteredCases
                                                }
                                                filteredSamples={
                                                    props.filteredFiles
                                                }
                                                logScale={logScale}
                                                metricType={metric}
                                                samplesByValueMap={getSamplesByValueMap(
                                                    props.filteredFiles,
                                                    metric.value
                                                )}
                                                hideNA={hideNA}
                                            />
                                        );
                                    } else {
                                        return (
                                            <div style={{ marginRight: 20 }}>
                                                <ExplorePlot
                                                    filteredCases={
                                                        props.filteredCases
                                                    }
                                                    filteredSamples={
                                                        props.filteredSamples
                                                    }
                                                    logScale={logScale}
                                                    width={400}
                                                    normalizersByField={
                                                        normalizersByField
                                                    }
                                                    metricType={metric}
                                                    selectedField={option}
                                                    hideNA={hideNA}
                                                />{' '}
                                            </div>
                                        );
                                    }
                                })}
                        </div>
                    </div>
                )}
            </>
        );
    }
);

export default ExploreTabs;
