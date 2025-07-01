import { observer } from 'mobx-react';
import { MobxPromise } from 'mobxpromise';
import React, { useState } from 'react';
import { MultiValueProps } from 'react-select';
import _ from 'lodash';

import {
    GroupsByProperty,
    ISelectedFiltersByAttrName,
} from '@htan/data-portal-filter';
import {
    Atlas,
    AtlasMetaData,
    Entity,
    getNormalizedOrgan,
    PublicationManifest,
} from '@htan/data-portal-commons';

import { AtlasTable } from './AtlasTable';
import { BiospecimenTable } from './BiospecimenTable';
import { CaseTable } from './CaseTable';
import { DEFAULT_EXPLORE_PLOT_OPTIONS, ExplorePlot } from './ExplorePlot';
import { FileTable } from './FileTable';
import { PublicationTable } from './PublicationTable';
import { ExploreTab } from '../lib/types';

import styles from './exploreTabs.module.scss';

// TODO we should move this into packages/data-portal-commons
import { assayPlotQuery, plotQuery } from '../../../../lib/clickhouseStore';

interface IExploreTabsProps {
    setTab: (tab: ExploreTab) => void;
    files: Entity[];
    activeTab: ExploreTab;
    filteredFiles: Entity[];
    nonAtlasSelectedFiltersByAttrName: ISelectedFiltersByAttrName;
    samples: MobxPromise<Entity[]>;
    samplesFiltered: MobxPromise<Entity[]>;
    cases: MobxPromise<Entity[]>;
    atlases: MobxPromise<Atlas[]>;
    filteredCasesByNonAtlasFilters: MobxPromise<Entity[]>;
    filteredSamplesByNonAtlasFilters: MobxPromise<Entity[]>;
    filteredCases: MobxPromise<Entity[]>;
    filteredSamples: Entity[];
    publications: PublicationManifest[];
    groupsByPropertyFiltered: GroupsByProperty<Entity>;
    filteredSynapseAtlases: Atlas[];
    filteredSynapseAtlasesByNonAtlasFilters: Atlas[];
    selectedSynapseAtlases: Atlas[];
    allSynapseAtlases: Atlas[];
    onSelectAtlas?: (selected: Atlas[]) => void;
    cloudBaseUrl?: string;

    toggleShowAllBiospecimens: () => void;
    showAllBiospecimens: boolean;
    toggleShowAllCases: () => void;
    showAllCases: boolean;

    getAtlasMetaData: () => AtlasMetaData;
    publicationManifestByUid: { [uid: string]: PublicationManifest };
    filteredPublications: PublicationManifest[];
    filterString: string;
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
): Record<string, string[]> {
    const ret = entities.reduce((agg: Record<string, string[]>, file) => {
        if (file.assayName) {
            agg[file.assayName] = agg[file.assayName] || [];
            agg[file.assayName].push(...file.biospecimenIds); // this should be biospecimen, not IDS but we changted it
        }
        return agg;
    }, {});

    return ret;
    // return _.mapValues(ret, (v, k) =>
    //     _.uniqBy(v, (e) => e[countByField as keyof Entity])
    // );
}

export const ExploreTabs: React.FunctionComponent<IExploreTabsProps> = observer(
    (props) => {
        const [logScale, setLogScale] = useState(false);

        // TODO harmonization is not functional yet
        const [harmonize, setHarmonize] = useState(true);

        const [hideNA, setHideNA] = useState(false);

        const [metric, setMetric] = useState(metricTypes[0]);

        const [selectedFields, setSelectedFields] = useState(
            DEFAULT_EXPLORE_PLOT_OPTIONS.filter(
                (opt) => /./.test(opt.value) // lets just do all of them now
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
                                onClick={() => props.setTab(ExploreTab.ATLAS)}
                                className={`nav-link ${
                                    props.activeTab === ExploreTab.ATLAS
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
                                    props.setTab(ExploreTab.PUBLICATION)
                                }
                                className={`nav-link ${
                                    props.activeTab === ExploreTab.PUBLICATION
                                        ? 'active'
                                        : ''
                                }`}
                            >
                                Publications
                            </a>
                        </li>
                        <li className="nav-item">
                            <a
                                onClick={() => props.setTab(ExploreTab.CASES)}
                                className={`nav-link ${
                                    props.activeTab === ExploreTab.CASES
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
                                    props.setTab(ExploreTab.BIOSPECIMEN)
                                }
                                className={`nav-link ${
                                    props.activeTab === ExploreTab.BIOSPECIMEN
                                        ? 'active'
                                        : ''
                                }`}
                            >
                                Biospecimens
                            </a>
                        </li>
                        <li className="nav-item">
                            <a
                                onClick={() => props.setTab(ExploreTab.FILE)}
                                className={`nav-link ${
                                    props.activeTab === ExploreTab.FILE
                                        ? 'active'
                                        : ''
                                }`}
                            >
                                Files
                            </a>
                        </li>
                        <li className="nav-item">
                            <a
                                onClick={() => props.setTab(ExploreTab.PLOTS)}
                                className={`nav-link ${
                                    props.activeTab === ExploreTab.PLOTS
                                        ? 'active'
                                        : ''
                                }`}
                            >
                                Plots{' '}
                                <span style={{ color: 'orange' }}>Beta!</span>
                            </a>
                        </li>
                    </ul>
                </div>

                {props.activeTab === ExploreTab.FILE && (
                    <div
                        className={`tab-content fileTab ${
                            props.activeTab !== ExploreTab.FILE ? 'd-none' : ''
                        }`}
                    >
                        <FileTable
                            entities={props.filteredFiles}
                            groupsByPropertyFiltered={
                                props.groupsByPropertyFiltered
                            }
                            patientCount={
                                props.filteredCases.result?.length || 0
                            }
                            publicationsByUid={props.publicationManifestByUid}
                        />
                    </div>
                )}

                {props.activeTab === ExploreTab.BIOSPECIMEN && (
                    <div
                        className={`tab-content biospecimen ${
                            props.activeTab !== ExploreTab.BIOSPECIMEN
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
                            synapseAtlases={props.atlases.result || []}
                            samples={props.samples.result || []}
                            publicationsByUid={_.keyBy(
                                props.publications,
                                'publicationId'
                            )}
                        />
                    </div>
                )}

                {props.activeTab === ExploreTab.CASES && (
                    <div
                        className={`tab-content cases ${
                            props.activeTab !== ExploreTab.CASES ? 'd-none' : ''
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
                            cases={props.cases.result || []}
                            publicationsByUid={_.keyBy(
                                props.publications,
                                'publicationId'
                            )}
                        />
                    </div>
                )}

                {props.activeTab === ExploreTab.PUBLICATION && (
                    <div
                        className={`tab-content ${styles.publicationTab} ${
                            props.activeTab !== ExploreTab.PUBLICATION
                                ? 'd-none'
                                : ''
                        }`}
                    >
                        <PublicationTable
                            publications={props.filteredPublications}
                            participants={props.cases.result!}
                            filteredParticipants={props.filteredCases.result!}
                            biospecimens={props.samples.result!}
                            filteredBiospecimens={props.samplesFiltered.result!}
                            files={props.files}
                            filteredFiles={props.filteredFiles}
                        />
                    </div>
                )}

                {props.activeTab === ExploreTab.ATLAS && (
                    <div
                        className={`tab-content ${styles.atlasTab} ${
                            props.activeTab !== ExploreTab.ATLAS ? 'd-none' : ''
                        }`}
                    >
                        <AtlasTable
                            setTab={props.setTab}
                            publications={props.publications}
                            atlases={props.atlases.result || []}
                            getAtlasMetaData={props.getAtlasMetaData}
                            selectedAtlases={props.selectedSynapseAtlases}
                            filteredAtlases={
                                props.filteredSynapseAtlasesByNonAtlasFilters
                            }
                            onSelectAtlas={props.onSelectAtlas}
                            filteredCases={
                                props.filteredCasesByNonAtlasFilters.result!
                            }
                            filteredBiospecimens={
                                props.filteredSamplesByNonAtlasFilters.result!
                            }
                            selectedFiltersByAttrName={
                                props.nonAtlasSelectedFiltersByAttrName
                            }
                            filteredFiles={props.filteredFiles}
                            cloudBaseUrl={props.cloudBaseUrl || ''}
                        />
                    </div>
                )}

                {props.activeTab === ExploreTab.PLOTS && (
                    <div
                        className={`tab-content fileTab ${
                            props.activeTab !== ExploreTab.PLOTS ? 'd-none' : ''
                        }`}
                    >
                        <div className={'alert alert-warning'}>
                            This feature is in beta.
                        </div>

                        <form
                            className={'d-flex'}
                            style={{ alignItems: 'center' }}
                        >
                            {/*<div style={{ width: 300, marginRight: 20 }}>*/}
                            {/*    <Select*/}
                            {/*        classNamePrefix={'react-select'}*/}
                            {/*        isSearchable={false}*/}
                            {/*        isClearable={false}*/}
                            {/*        isMulti={true}*/}
                            {/*        name={'field'}*/}
                            {/*        components={{ MultiValue }}*/}
                            {/*        controlShouldRenderValue={true}*/}
                            {/*        options={DEFAULT_EXPLORE_PLOT_OPTIONS}*/}
                            {/*        defaultValue={selectedFields}*/}
                            {/*        hideSelectedOptions={false}*/}
                            {/*        closeMenuOnSelect={false}*/}
                            {/*        onChange={(e) => {*/}
                            {/*            setSelectedFields(e as any);*/}
                            {/*        }}*/}
                            {/*    />*/}
                            {/*</div>*/}

                            {/*<div style={{ width: 300, marginRight: 20 }}>*/}
                            {/*    <Select*/}
                            {/*        classNamePrefix={'react-select'}*/}
                            {/*        isSearchable={false}*/}
                            {/*        isClearable={false}*/}
                            {/*        name={'xaxis'}*/}
                            {/*        controlShouldRenderValue={true}*/}
                            {/*        options={metricTypes}*/}
                            {/*        hideSelectedOptions={false}*/}
                            {/*        closeMenuOnSelect={true}*/}
                            {/*        onChange={(e) => {*/}
                            {/*            setMetric(e!);*/}
                            {/*        }}*/}
                            {/*        value={metric}*/}
                            {/*    />*/}
                            {/*</div>*/}
                            <div style={{ marginRight: 20 }}>
                                <div className="form-check">
                                    <input
                                        className="form-check-input"
                                        type="checkbox"
                                        checked={logScale}
                                        onChange={() => setLogScale(!logScale)}
                                    />
                                    <label className="form-check-label">
                                        Log Scale
                                    </label>
                                </div>
                            </div>

                            {/*<div style={{ marginRight: 20 }}>*/}
                            {/*    <div className="form-check">*/}
                            {/*        <input*/}
                            {/*            className="form-check-input"*/}
                            {/*            type="checkbox"*/}
                            {/*            checked={hideNA}*/}
                            {/*            onChange={() => setHideNA(!hideNA)}*/}
                            {/*        />*/}
                            {/*        <label className="form-check-label">*/}
                            {/*            Hide NA*/}
                            {/*        </label>*/}
                            {/*    </div>*/}
                            {/*</div>*/}

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

                        <div className={'d-flex flex-wrap'}>
                            <div style={{ marginRight: 20 }}>
                                <ExplorePlot
                                    logScale={logScale}
                                    width={400}
                                    metricType={metric}
                                    selectedField={{
                                        data: { type: 'SAMPLE' },
                                        label: 'Assay',
                                        value: 'assayName',
                                    }}
                                    hideNA={hideNA}
                                    query={assayPlotQuery({
                                        filterString: props.filterString,
                                    })}
                                />{' '}
                            </div>

                            {selectedFields.map((option) => {
                                return (
                                    <div style={{ marginRight: 20 }}>
                                        <ExplorePlot
                                            logScale={logScale}
                                            width={400}
                                            // normalizersByField={
                                            //     normalizersByField
                                            // }
                                            metricType={metric}
                                            selectedField={option}
                                            hideNA={hideNA}
                                            query={plotQuery({
                                                field: option.value,
                                                table: option.table,
                                                filterString:
                                                    props.filterString,
                                            })}
                                        />{' '}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </>
        );
    }
);

export default ExploreTabs;
