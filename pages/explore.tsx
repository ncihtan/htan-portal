import React from 'react';
import HtanNavbar from '../components/HtanNavbar';
import Footer from '../components/Footer';
import _ from 'lodash';
import {loadData, Entity, Atlas, sortStageOptions, LoadDataResult} from '../lib/helpers';
import FileTable from '../components/filter/FileTable';
import Select, { ActionMeta, ValueType } from 'react-select';
import getData from '../lib/getData';
import fetch from 'node-fetch';
import { toArabic } from 'roman-numerals';

import {action, computed, makeObservable, observable, runInAction} from 'mobx';
import { fromPromise } from 'mobx-utils';


import { getAtlasList, WORDPRESS_BASE_URL } from '../ApiUtil';
import { GetStaticProps } from 'next';
import { WPAtlas } from '../types';
import { WPAtlasTable } from '../components/filter/WPAtlasTable';
import { Button } from 'react-bootstrap';
import { observer } from 'mobx-react';
import FilterPanel from '../components/FilterPanel/FilterPanel';
import {
    ExploreOptionType,
    IFilterProps, IFiltersByGroupName,
    PropMap,
    PropNames,
} from '../lib/types';
import FilterCheckList from '../components/FilterPanel/FilterCheckList';
import {IPromiseBasedObservable} from "mobx-utils";
import {ScaleLoader} from "react-spinners";
import {withRouter, NextRouter} from "next/router";
import styles from "./styles.module.scss";
import FilterPropertyColumnShell from "../components/FilterPanel/FilterPropertyColumn";

export const getStaticProps: GetStaticProps = async (context) => {
    let slugs = ['summary-blurb-data-release'];
    let overviewURL = `${WORDPRESS_BASE_URL}${JSON.stringify(slugs)}`;
    let res = await fetch(overviewURL);
    //let data = await res.json();

    const atlases = await getAtlasList();

    return {
        props: {
            atlasData: atlases,
            //data,
        },
    };
};

const synapseData = getData();

enum ExploreTab {
    FILE = 'file',
    ATLAS = 'atlas',
    BIOSPECIMEN = 'biospecimen',
    CASES = 'cases'
}

@observer
class Search extends React.Component<{ router: NextRouter, wpData: WPAtlas[] }, IFilterProps> {
    @observable.ref private dataLoadingPromise:IPromiseBasedObservable<LoadDataResult>|undefined;

    constructor(props: any) {
        super(props);
        this.state = { files: [], filters: {}, atlases: [] };

        //@ts-ignore
        if (typeof window !== 'undefined') (window as any).me = this;

        makeObservable(this);
    }

    get activeTab() {
        return this.props.router.query.tab || ExploreTab.FILE;
    }

    get getGroupsByProperty() {
        return this.groupsByProperty(this.state.files);
    }

    get getGroupsByPropertyFiltered() {
        return this.groupsByProperty(this.filteredFiles);
    }

    groupsByProperty(files: Entity[]) {
        const m: any = {};
        _.forEach(PropMap, (o, k) => {
            m[k] = _.groupBy(files, (f) => {
                //@ts-ignore
                const val = _.at(f, [o.prop]);
                return val ? val[0] : 'other';
            });
        });
        return m;
    }

    @observable.ref someValue: ExploreOptionType[] = [];

    @computed get selectedFiltersByGroupName() : IFiltersByGroupName {
        return _.groupBy(this.someValue, (item) => {
            return item.group;
        });
    }

    @action.bound
    setFilter(groupNames: string[], actionMeta: ActionMeta<ExploreOptionType>) {
        //const filters = Object.assign({}, this.state.filters);

        if (actionMeta && actionMeta.option) {
            // first remove the item
            this.someValue = this.someValue.filter((o)=>{
                return o.group !== actionMeta!.option!.group! || o.value !== actionMeta!.option!.value!;
            });

            if (actionMeta.action === 'deselect-option') {
                const option = actionMeta.option;
            } else if (actionMeta.action === 'select-option') {
                const option = actionMeta.option;
                this.someValue = this.someValue.concat([option]);
            }
        } else if (actionMeta.action === 'clear') {
            this.someValue = this.someValue.filter((o)=>{
                return o.group !== actionMeta!.option!.group
            });
        }
    }

    componentDidMount(): void {
        runInAction(()=> {
            this.dataLoadingPromise = fromPromise(loadData(this.props.wpData));
            this.dataLoadingPromise.then(({files, atlases}) => {
                const filteredFiles = files.filter((f) => !!f.diagnosis);
                this.setState({files: filteredFiles, atlases: atlases});
            });
        });
    }

    setTab(tab: string) {
        this.props.router.push({
            pathname: this.props.router.pathname,
            query: { tab }
        }, undefined, { shallow: true });
    }

    filterFiles(filters: { [key: string]: ExploreOptionType[] }, files: Entity[]) {
        if (_.size(filters)) {
            // find the files where the passed filters match
            return files.filter((f) => {
                return _.every(filters, (filter, name) => {
                    //@ts-ignore
                    const val = _.at(f, PropMap[name].prop);
                    //@ts-ignore
                    return val ? filter.map((f)=>f.value).includes(val[0]) : false;
                });
            });
        } else {
            return files;
        }
    }

    makeOptions(propName: string): ExploreOptionType[] {

        const filteredFilesMinusOption = this.groupsByProperty(
            this.filterFiles(
                _.omit(this.selectedFiltersByGroupName, [propName]),
                this.state.files
            )
        )[propName];

        return _.map(this.getGroupsByProperty[propName], (val, key) => {
            const count = key in filteredFilesMinusOption ? filteredFilesMinusOption[key].length : 0;
            return {
                value: key,
                label: key,
                group: propName,
                count
            };
        });
    }

    isOptionSelected = (option:ExploreOptionType) => {
        return (
            _.find(this.someValue,
                (o:ExploreOptionType) => o.value === option.value && option.group === o.group
            ) !== undefined
        );
    };

    get filteredFiles() {
        return this.filterFiles(this.selectedFiltersByGroupName, this.state.files);
    }

    @action.bound handleChange(
        value: any,
        actionMeta: ActionMeta<ExploreOptionType>
    ) {

        this.someValue = this.someValue.filter((o)=>{
            return o.group !== actionMeta!.option!.group! || o.value !== actionMeta!.option!.value!;
        });

        this.someValue = this.someValue.concat([actionMeta.option!]);
    }

    @computed
    get samples(){
        return _(this.filteredFiles)
            .filter((f) => f.biospecimen && f.biospecimen.HTANParentID)
            .map((f: any) => f.biospecimen)
            .uniqBy((f) => f.HTANBiospecimenID)
            .value();
    }

    @computed
    get cases(){
        return _(this.filteredFiles)
            .map((f: any) => f.diagnosis)
            .uniqBy((f)=>f.HTANParticipantID)
            .value();
    }

    render() {
        var self = this;

        //@ts-ignore
        const patients = this.cases.length;

        if (!this.dataLoadingPromise || this.dataLoadingPromise.state === "pending") {
            // TODO: Pretty this up
            return (
                <div
                    className={styles.loadingIndicator}
                >
                    <ScaleLoader/>
                </div>
            );
        }
        if (this.filteredFiles) {
            return (
                <div style={{ padding: 20 }}>

                    <div className="filterControls">

                        <div>
                            <div style={{ width: 220 }}>
                                <Select
                                    isSearchable
                                    isClearable={false}
                                    name="searchAll"
                                    placeholder="Search all filters"
                                    controlShouldRenderValue={false}
                                    isMulti={true}
                                    options={[
                                        PropNames.AtlasName,
                                        PropNames.TissueorOrganofOrigin,
                                        PropNames.PrimaryDiagnosis,
                                        PropNames.Component,
                                        PropNames.Stage
                                    ].map((propName) => {
                                        return {
                                            label:
                                            PropMap[propName]
                                                .displayName,
                                            options: this.makeOptions(
                                                propName
                                            ).map((option) =>
                                                Object.assign(option, {
                                                    group: propName,
                                                })
                                            ),
                                        };
                                    })}
                                    hideSelectedOptions={false}
                                    closeMenuOnSelect={false}
                                    onChange={this.handleChange}
                                    isOptionSelected={this.isOptionSelected}
                                    value={
                                        this.selectedFiltersByGroupName[
                                            PropNames.AtlasName
                                            ]
                                    }
                                />
                            </div>
                        </div>

                        <div>
                            <div style={{ width: 220 }}>
                                <FilterPanel placeholder={"Cancer Type"}>
                                    <div
                                        className={
                                            'filter-checkbox-list-container'
                                        }
                                    >
                                        <FilterPropertyColumnShell title={"Cancer Type"}>
                                            <FilterCheckList
                                                setFilter={
                                                    this.setFilter
                                                }
                                                filters={this.selectedFiltersByGroupName}
                                                options={this.makeOptions(
                                                    PropNames.PrimaryDiagnosis
                                                )}
                                            ></FilterCheckList>
                                        </FilterPropertyColumnShell>
                                        <FilterPropertyColumnShell title={"Stage"}>
                                            <FilterCheckList
                                                setFilter={
                                                    this.setFilter
                                                }
                                                filters={this.selectedFiltersByGroupName}
                                                options={sortStageOptions(this.makeOptions(
                                                    PropNames.Stage
                                                ))}
                                            ></FilterCheckList>
                                            }
                                        </FilterPropertyColumnShell>

                                    </div>
                                </FilterPanel>
                            </div>
                        </div>

                        <div>
                            <div style={{ width: 220 }}>
                                <FilterPanel placeholder={"Tissue Type"}>
                                    <FilterPropertyColumnShell title={"Tissue Type"}>
                                        <FilterCheckList
                                            setFilter={
                                                this.setFilter
                                            }
                                            filters={this.selectedFiltersByGroupName}
                                            options={this.makeOptions(
                                                PropNames.TissueorOrganofOrigin
                                            )}
                                        />
                                    </FilterPropertyColumnShell>
                                </FilterPanel>
                            </div>
                        </div>

                        <div>
                            <div style={{ width: 220 }}>
                                <FilterPanel placeholder={"Assay Type"}>
                                    <FilterPropertyColumnShell title={"Assay Type"}>
                                        <FilterCheckList
                                            setFilter={
                                                this.setFilter
                                            }
                                            filters={this.selectedFiltersByGroupName}
                                            options={this.makeOptions(
                                                PropNames.Component
                                            )}
                                        />
                                    </FilterPropertyColumnShell>
                                </FilterPanel>
                            </div>
                        </div>

                        <div>
                            <div style={{ width: 220 }}>
                                <FilterPanel placeholder={"File Type"}>
                                    <FilterPropertyColumnShell title={"File Type"}>
                                        <FilterCheckList
                                            setFilter={
                                                this.setFilter
                                            }
                                            filters={this.selectedFiltersByGroupName}
                                            options={this.makeOptions(
                                                PropNames.Level
                                            )}
                                        ></FilterCheckList>
                                    </FilterPropertyColumnShell>
                                </FilterPanel>
                            </div>
                        </div>



                    </div>

                    <div className={'filter'}>
                        {Object.keys(this.selectedFiltersByGroupName).map(
                            (filter, i, filters) => {
                                const numberOfAttributes = filters.length;
                                const addAnd =
                                    numberOfAttributes > 1 &&
                                    i < numberOfAttributes - 1 ? (
                                        <span className="logicalAnd">
                                                AND
                                            </span>
                                    ) : null;

                                return (
                                    <span className="attributeGroup">
                                            <span
                                                className="attributeGroupName"
                                                onClick={() => {
                                                    this.setFilter([filter], {
                                                        action: 'clear',
                                                    });
                                                }}
                                            >
                                                {
                                                    PropMap[
                                                        PropNames[
                                                            filter as keyof typeof PropNames
                                                            ]
                                                        ].displayName
                                                }
                                            </span>

                                        {this.selectedFiltersByGroupName[filter].map(
                                            (value, i, values) => {
                                                const numberOfValues =
                                                    values.length;
                                                const openParenthesis =
                                                    numberOfValues > 1 &&
                                                    i == 0 ? (
                                                        <span className="logicalParentheses">
                                                                (
                                                            </span>
                                                    ) : null;
                                                const addOr =
                                                    numberOfValues > 1 &&
                                                    i <
                                                    numberOfValues -
                                                    1 ? (
                                                        <span className="logicalOr">
                                                                OR
                                                            </span>
                                                    ) : null;
                                                const closeParenthesis =
                                                    numberOfValues > 1 &&
                                                    i ==
                                                    numberOfValues -
                                                    1 ? (
                                                        <span className="logicalParentheses">
                                                                )
                                                            </span>
                                                    ) : null;

                                                return (
                                                    <span className="attributeValues">
                                                            {openParenthesis}
                                                        <span
                                                            className="attributeValue"
                                                            onClick={() => {
                                                                this.setFilter(
                                                                    [
                                                                        filter,
                                                                    ],
                                                                    {
                                                                        action:
                                                                            'deselect-option',
                                                                        option: {
                                                                            label:
                                                                                '',
                                                                            value:value.value,
                                                                            group: filter,
                                                                        },
                                                                    }
                                                                );
                                                            }}
                                                        >
                                                                {value.value}
                                                            </span>
                                                        {addOr}
                                                        {closeParenthesis}
                                                        </span>
                                                );
                                            }
                                        )}
                                        {addAnd}
                                        </span>
                                );
                            }
                        )}
                    </div>


                    <div className="subnav">
                        <ul className="nav nav-tabs">
                            <li className="nav-item">
                                <a
                                    onClick={() => this.setTab(ExploreTab.ATLAS)}
                                    className={`nav-link ${
                                        this.activeTab === ExploreTab.ATLAS
                                            ? 'active'
                                            : ''
                                    }`}
                                >
                                    Atlases
                                </a>
                            </li>
                            <li className="nav-item">
                                <a
                                    onClick={() => this.setTab(ExploreTab.CASES)}
                                    className={`nav-link ${
                                        this.activeTab === ExploreTab.CASES
                                            ? 'active'
                                            : ''
                                    }`}
                                >
                                    Cases
                                </a>
                            </li>
                            <li className="nav-item">
                                <a
                                    onClick={() => this.setTab(ExploreTab.BIOSPECIMEN)}
                                    className={`nav-link ${
                                        this.activeTab === ExploreTab.BIOSPECIMEN
                                            ? 'active'
                                            : ''
                                    }`}
                                >
                                    Biospecimen
                                </a>
                            </li>
                            <li className="nav-item">
                                <a
                                    onClick={() => this.setTab(ExploreTab.FILE)}
                                    className={`nav-link ${
                                        this.activeTab === ExploreTab.FILE
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
                            this.activeTab !== 'file' ? 'd-none' : ''
                        }`}
                    >
                        <FileTable
                            entities={this.filteredFiles}
                            getGroupsByPropertyFiltered={this.getGroupsByPropertyFiltered}
                            patientCount={patients}
                        />
                    </div>

                    <div
                        className={`tab-content biospecimen ${
                            this.activeTab !== ExploreTab.BIOSPECIMEN ? 'd-none' : ''
                        }`}
                    >
                        <table className={"table table-striped"}>
                            <thead>
                                <tr>
                                    <th>HTANBiospecimenID</th>
                                    <th>atlasid</th>
                                    <th>BiospecimenType</th>
                                    <th></th>
                                </tr>
                            </thead>
                            <tbody>
                            {
                                this.samples.map((specimen)=>{
                                   return  <tr>
                                       <td>{specimen.HTANBiospecimenID}</td>
                                       <td>{specimen.atlasid}</td>
                                       <td>{specimen.BiospecimenType}</td>
                                       <td>
                                           <button className={"btn btn-primary btn-sm"}>Download</button>
                                       </td>
                                   </tr>
                                })
                            }
                            </tbody>
                        </table>
                    </div>

                    <div
                        className={`tab-content cases ${
                            this.activeTab !== ExploreTab.CASES ? 'd-none' : ''
                        }`}
                    >
                        <table className={"table table-striped"}>
                            <thead>
                            <tr>
                                <th>HTANParticipantID</th>
                                <th>Atlas</th>
                                <th>PrimaryDiagnosis</th>
                                <th>Age at diagnosis</th>
                                <th></th>
                            </tr>
                            </thead>
                            <tbody>
                            {
                                this.cases.map((specimen)=>{
                                    return  <tr>
                                        <td>{specimen.HTANParticipantID}</td>
                                        <td>{specimen.atlasid}</td>
                                        <td>{specimen.PrimaryDiagnosis}</td>
                                        <td>{specimen.AgeatDiagnosis}</td>
                                        <td>
                                            <a href={"#"}>Download</a>
                                        </td>
                                    </tr>
                                })
                            }
                            </tbody>
                        </table>
                    </div>


                    <div
                        className={`tab-content atlasTab ${
                            this.activeTab !== 'atlas' ? 'd-none' : ''
                        }`}
                    >
                        <WPAtlasTable atlasData={this.props.wpData} />
                    </div>
                </div>
            );
        }
    }
}

interface IFilterPageProps {
    atlasData: any;
    router: NextRouter;
}

const FilterPage = (props: IFilterPageProps) => {
    return (
        <>
            <HtanNavbar />

            <Search router={props.router} wpData={props.atlasData} />

            <Footer />
        </>
    );
};

export default withRouter(FilterPage);
