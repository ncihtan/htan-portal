import _ from 'lodash';
import { action, computed, makeObservable, observable, runInAction } from 'mobx';
import { observer } from 'mobx-react';
import { fromPromise, IPromiseBasedObservable } from "mobx-utils";
import { GetStaticProps } from 'next';
import { withRouter, NextRouter } from "next/router";
import fetch from 'node-fetch';
import React from 'react';
import { ActionMeta } from 'react-select';
import { ScaleLoader } from "react-spinners";

import { getAtlasList, WORDPRESS_BASE_URL } from '../ApiUtil';
import { filterFiles, groupsByProperty } from "../lib/filterHelpers";
import getData from '../lib/getData';
import {
    loadData,
    LoadDataResult,
    parseSelectedFilters,
    updateSelectedFiltersInURL
} from '../lib/helpers';
import {
    ExploreSelectedFilter,
    IFilterProps,
    IFiltersByGroupName,
} from '../lib/types';
import { WPAtlas } from '../types';
import HtanNavbar from '../components/HtanNavbar';
import Footer from '../components/Footer';
import FilterControls from "../components/filter/FilterControls";
import Filter from "../components/filter/Filter";
import ExploreTabs from "../components/ExploreTabs";

import styles from "./styles.module.scss";


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

    get selectedFilters(): ExploreSelectedFilter[] {
        return parseSelectedFilters(this.props.router.query.selectedFilters as string|undefined) || [];
    }

    get getGroupsByProperty() {
        return groupsByProperty(this.state.files);
    }

    get getGroupsByPropertyFiltered() {
        return groupsByProperty(this.filteredFiles);
    }

    @computed get selectedFiltersByGroupName() : IFiltersByGroupName {
        return _.groupBy(this.selectedFilters, (item) => {
            return item.group;
        });
    }

    @action.bound
    setFilter(groupNames: string[], actionMeta: ActionMeta<ExploreSelectedFilter>) {
        //const filters = Object.assign({}, this.state.filters);

        let newFilters:ExploreSelectedFilter[] = this.selectedFilters;
        if (actionMeta && actionMeta.option) {
            // first remove the item
            newFilters = this.selectedFilters.filter((o)=>{
                return o.group !== actionMeta!.option!.group! || o.value !== actionMeta!.option!.value!;
            });

            if (actionMeta.action === 'select-option') {
                const option = actionMeta.option;
                newFilters = newFilters.concat([option]);
            }
        } else if (actionMeta.action === 'clear') {
            newFilters = this.selectedFilters.filter((o)=>{
                return o.group !== actionMeta!.option!.group
            });
        }

        updateSelectedFiltersInURL(newFilters, this.props.router);
    }

    componentDidMount(): void {
        runInAction(()=> {
            this.dataLoadingPromise = fromPromise(loadData(this.props.wpData));
            this.dataLoadingPromise.then(({files, atlases}) => {
                this.setState({files, atlases});
            });
        });
    }

    get filteredFiles() {
        return filterFiles(this.selectedFiltersByGroupName, this.state.files);
    }

    @computed
    get samples(){
        return _.chain(this.filteredFiles)
            .filter((f) => !!f.biospecimen && !!f.biospecimen.HTANParentID)
            .map((f: any) => f.biospecimen)
            .uniqBy((f) => f.HTANBiospecimenID)
            .value();
    }

    @computed
    get cases(){
        return _.chain(this.filteredFiles)
            .map((f: any) => f.diagnosis)
            .uniqBy((f)=>f.HTANParticipantID)
            .value();
    }

    render() {
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

                    <FilterControls
                        router={this.props.router}
                        setFilter={this.setFilter}
                        selectedFiltersByGroupName={this.selectedFiltersByGroupName}
                        selectedFilters={this.selectedFilters}
                        files={this.state.files}
                        getGroupsByProperty={this.getGroupsByProperty}
                    />

                    <Filter
                        setFilter={this.setFilter}
                        selectedFiltersByGroupName={this.selectedFiltersByGroupName}
                    />

                    <ExploreTabs
                        router={this.props.router}
                        filteredFiles={this.filteredFiles}
                        samples={this.samples}
                        cases={this.cases}
                        wpData={this.props.wpData}
                        getGroupsByPropertyFiltered={this.getGroupsByPropertyFiltered}
                    />

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
