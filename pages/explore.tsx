import React from "react";
import HtanNavbar from "../components/HtanNavbar";
import Footer from "../components/Footer";
import _ from "lodash";
import { loadData, Entity, Atlas } from "../lib/helpers";
import AtlasTable from "../components/filter/AtlasTable";
import FileTable from "../components/filter/FileTable";
import FilterSelection from "../components/filter/FilterSelection";
import Select, { ActionMeta, ValueType } from "react-select";
import getData from "../lib/getData";
import fetch from "node-fetch";

import {makeObservable, observable} from "mobx";

import {
  DataReleasePage,
  DataReleaseProps,
} from "../components/DataReleasePage";
import { getAtlasList, WORDPRESS_BASE_URL } from "../ApiUtil";
import { GetStaticProps } from "next";
import { WPAtlas } from "../types";
import { WPAtlasTable } from "../components/filter/WPAtlasTable";
import { Button } from "react-bootstrap";
import {observer} from "mobx-react";

export const getStaticProps: GetStaticProps = async (context) => {
  let slugs = ["summary-blurb-data-release"];
  let overviewURL = `${WORDPRESS_BASE_URL}${JSON.stringify(slugs)}`;
  let res = await fetch(overviewURL);
  let data = await res.json();

  const atlases = await getAtlasList();

  return {
    props: {
      atlasData: atlases,
      data,
    },
  };
};

const synapseData = getData();

type ExploreOptionType = {
  value: string;
  label: string;
  group: string;
}

enum PropNames {
  TissueorOrganofOrigin = "TissueorOrganofOrigin",
  PrimaryDiagnosis = "PrimaryDiagnosis",
  Component = "Component",
  Biospecimen = "Biospecimen",
  AtlasName = "AtlasName",
}

const propMap = {
  [PropNames.TissueorOrganofOrigin]: {
    prop: "diagnosis.TissueorOrganofOrigin",
    displayName: "Organ"
  },
  [PropNames.PrimaryDiagnosis]: {
    prop: "diagnosis.PrimaryDiagnosis",
    displayName: "Diagnosis"
  },
  [PropNames.Component]: {
    prop: "Component",
    displayName: "Assay"
  },
  [PropNames.Biospecimen]: {
    prop: "Biospecimen",
    displayName: "Biospecimen"
  },
  [PropNames.AtlasName]: {
    prop: "WPAtlas.title.rendered",
    displayName: "Atlas"
  },
};

interface IFilterProps {
  files: Entity[];
  filters: { [key: string]: string[] };
  atlases: Atlas[];
  activeTab: string;
}

@observer
 class Search extends React.Component<{ wpData: WPAtlas[] }, IFilterProps> {
  constructor(props: any) {
    super(props);
    this.state = { files: [], filters: {}, atlases: [], activeTab: "file" };

    this.isOptionSelected = this.isOptionSelected.bind(this);

    //@ts-ignore
    if (typeof window !== 'undefined') (window as any).me = this;

    makeObservable(this);
  }

  get getGroupsByProperty() {
    return this.groupsByProperty(this.state.files);
  }

  get getGroupsByPropertyFiltered() {
    return this.groupsByProperty(this.filteredFiles);
  }

  groupsByProperty(files: Entity[]) {
    const m: any = {};
    _.forEach(propMap, (o, k) => {
      m[k] = _.groupBy(files, (f) => {
        //@ts-ignore
        const val = _.at(f, [o.prop]);
        return val ? val[0] : "other";
      });
    });
    return m;
  }

  setFilter(groupNames: string[], actionMeta: ActionMeta<ExploreOptionType>) {
    const filters = Object.assign({}, this.state.filters);

    if (actionMeta.option) {
      if (actionMeta.action === "deselect-option") {
        const option = actionMeta.option;
        filters[option.group] = filters[option.group].filter(value => value != option.value);
        if (filters[option.group].length === 0) {
          delete filters[option.group];
        }
      } else if (actionMeta.action === "select-option") {
        const option = actionMeta.option;
        if (filters[option.group]) {
          filters[option.group].push(option.value);
        } else {
          filters[option.group] = [option.value];
        }
      }
    } else if (actionMeta.action === "clear") {
      groupNames.forEach(group => {
        delete filters[group];
      });
    }
    this.setState({ filters: filters });
  }

  componentDidMount(): void {
    const data = loadData(this.props.wpData).then(({ files, atlases }) => {
      const filteredFiles = files.filter((f) => !!f.diagnosis);
      this.setState({ files: filteredFiles, atlases: atlases });
    });
  }

  setTab(activeTab: string) {
    this.setState({ activeTab });
  }

  filterFiles(filters: { [key: string]: string[] }, files: Entity[]) {
    if (_.size(filters)) {
      return files.filter((f) => {
        return _.every(filters, (filter, name) => {
          //@ts-ignore
          const val = _.at(f, propMap[name].prop);
          //@ts-ignore
          return val ? filter.includes(val[0]) : false;
        });
      });
    } else {
      return files;
    }
  }

  makeOptions(propName: string): ExploreOptionType[] {
    const filteredFilesMinusOption = this.groupsByProperty(
      this.filterFiles(_.omit(this.state.filters, [propName]), this.state.files)
    )[propName];
    return _.map(filteredFilesMinusOption, (val, key) => {
      return { value: key, label: `${key} (${val.length})`, group: propName };
    });
  }

  isOptionSelected(option: {value:string, label:string, group:string}) {
    return Object.keys(this.state.filters).length > 0 && option.group.length > 0 && this.state.filters[option.group] && this.state.filters[option.group].includes(option.value);
  }

  get filteredFiles() {
    return this.filterFiles(this.state.filters, this.state.files);
  }

  render() {
    var self = this;

    //@ts-ignore
    const patients = _(this.filteredFiles)
      .filter((f) => f.biospecimen && f.biospecimen.HTANParentID)
      .map((f: any) => f.biospecimen?.HTANParentID)
      .uniq()
      .value().length;

    if (this.filteredFiles) {
      return (
        <div style={{ padding: 20 }}>
          <div className="subnav">
            <ul className="nav nav-tabs">
              <li className="nav-item">
                <a
                  onClick={() => this.setTab("atlas")}
                  className={`nav-link ${
                    this.state.activeTab === "atlas" ? "active" : ""
                  }`}
                >
                  Atlases
                </a>
              </li>
              <li className="nav-item">
                <a className="nav-link disabled">Cases</a>
              </li>
              <li className="nav-item">
                <a className="nav-link disabled">Biospecimens</a>
              </li>
              <li className="nav-item">
                <a
                  onClick={() => this.setTab("file")}
                  className={`nav-link ${
                    this.state.activeTab === "file" ? "active" : ""
                  }`}
                >
                  Files
                </a>
              </li>
            </ul>
          </div>

          <div
            className={`tab-content fileTab ${
              this.state.activeTab !== "file" ? "d-none" : ""
            }`}
          >
            <div className="filterControls">
              {/* <FilterSelection options={
                    _.map(
                        this.getGroupsByProperty[PropNames.TissueorOrganofOrigin],
                        (val, key) => {
                            return key
                        }
                    )
                } /> */}

              <div>
                <div style={{ width: 300 }}>
                  <Select
                    isSearchable
                    isClearable={false}
                    name="searchAll"
                    placeholder="Search all filters"
                    controlShouldRenderValue={false}
                    isMulti={true}
                    options={ [PropNames.AtlasName,
                    PropNames.TissueorOrganofOrigin,
                    PropNames.PrimaryDiagnosis,
                    PropNames.Component].map(propName => { return {label:
                    propMap[propName].displayName, options: this.makeOptions(propName).map((option) => Object.assign(option, {"group":propName}))}
                    } ) }
                    hideSelectedOptions={false}
                    closeMenuOnSelect={false}
                    onChange={
                      (value: any, actionMeta: ActionMeta<ExploreOptionType>) => {
                        this.setFilter(
                          [PropNames.AtlasName, PropNames.TissueorOrganofOrigin, PropNames.PrimaryDiagnosis, PropNames.Component],
                          actionMeta
                        );
                      }
                    }
                    isOptionSelected={this.isOptionSelected}
                  />
                </div>
              </div>

              <div>
                <div style={{ width: 300 }}>
                  <Select
                    placeholder="Atlas"
                    controlShouldRenderValue={false}
                    isClearable={false}
                    isSearchable
                    name="color"
                    isMulti={true}
                    options={this.makeOptions(PropNames.AtlasName)}
                    hideSelectedOptions={false}
                    closeMenuOnSelect={false}
                    onChange={
                      (value: any, actionMeta: ActionMeta<ExploreOptionType>) => {
                        this.setFilter(
                          [PropNames.AtlasName],
                          actionMeta
                        );
                      }
                    }
                    isOptionSelected={this.isOptionSelected}
                  />
                </div>
              </div>

              <div>
                <div style={{ width: 300 }}>
                  <Select
                    placeholder="Organ"
                    controlShouldRenderValue={false}
                    isClearable={false}
                    isSearchable
                    name="color"
                    isMulti={true}
                    options={this.makeOptions(PropNames.TissueorOrganofOrigin)}
                    hideSelectedOptions={false}
                    closeMenuOnSelect={false}
                    onChange={
                      (value: any, actionMeta: ActionMeta<ExploreOptionType>) => {
                        this.setFilter(
                          [PropNames.TissueorOrganofOrigin],
                          actionMeta
                        );
                      }
                    }
                    isOptionSelected={this.isOptionSelected}
                  />
                </div>
              </div>

              {/* <select
                    className="form-control"
                    placeholder="helo"
                    style={{ marginBottom: 20, maxWidth: 200 }}
                    onChange={function (e: any) {
                      self.setFilter(
                        PropNames.TissueorOrganofOrigin,
                        [e.target.value]
                      );
                    }.bind(this)}
                  >
                    {_.map(
                      this.getGroupsByProperty[PropNames.TissueorOrganofOrigin],
                      (val, key) => {
                        return (
                          <option value={key}>
                            {key} ({val.length})
                          </option>
                        );
                      }
                    )}
                  </select> */}

              <div>
                <div style={{ width: 300 }}>
                  <Select
                    placeholder="Diagnosis"
                    controlShouldRenderValue={false}
                    isClearable={false}
                    isSearchable
                    name="color"
                    isMulti={true}
                    options={this.makeOptions(PropNames.PrimaryDiagnosis)}
                    hideSelectedOptions={false}
                    closeMenuOnSelect={false}
                    onChange={
                      (value: any, actionMeta: ActionMeta<ExploreOptionType>) => {
                        this.setFilter(
                          [PropNames.PrimaryDiagnosis],
                          actionMeta
                        );
                      }
                    }
                    isOptionSelected={this.isOptionSelected}
                  />
                </div>
              </div>

              {/* <select
                    className="form-control"
                    style={{ marginBottom: 20, maxWidth: 200 }}
                    onChange={function (e) {
                      self.setFilter(
                        PropNames.PrimaryDiagnosis,
                        [e.target.value]
                      );
                      //this.setState({selectedDiagnosis: e.target.value})
                    }}
                  >
                    {_.map(
                      this.getGroupsByProperty[PropNames.PrimaryDiagnosis],
                      (val, key) => {
                        return (
                          <option value={key}>
                            {key} ({val.length})
                          </option>
                        );
                      }
                    )}
                  </select> */}

              <div>
                <div style={{ width: 300 }}>
                  <Select
                    placeholder="Assay"
                    controlShouldRenderValue={false}
                    isClearable={false}
                    isSearchable
                    name="color"
                    isMulti={true}
                    options={this.makeOptions(PropNames.Component)}
                    hideSelectedOptions={false}
                    closeMenuOnSelect={false}
                    onChange={
                      (value: any, actionMeta: ActionMeta<ExploreOptionType>) => {
                        this.setFilter(
                          [PropNames.Component],
                          actionMeta
                        );
                      }
                    }
                    isOptionSelected={this.isOptionSelected}
                  />
                </div>
              </div>
            </div>

            <div className={"filter"}>
              {Object.keys(this.state.filters).map((filter, i, filters) => {
                const numberOfAttributes = filters.length;
                  const addAnd = numberOfAttributes > 1 && i < numberOfAttributes - 1? <span className="logicalAnd">AND</span> : null;

                return (
                  <span className="attributeGroup">
                    <span className="attributeGroupName" onClick={() => { this.setFilter([filter], {action:"clear"}) }}>{propMap[PropNames[filter as keyof typeof PropNames]].displayName}</span>

                    {this.state.filters[filter].map((value, i, values) => { 
                      const numberOfValues = values.length;
                      const openParenthesis = numberOfValues > 1 && i == 0? <span className="logicalParentheses">(</span> : null;
                      const addOr = numberOfValues > 1 && i < numberOfValues - 1? <span className="logicalOr">OR</span> : null;
                      const closeParenthesis = numberOfValues > 1 && i == numberOfValues - 1? <span className="logicalParentheses">)</span> : null;

                      return (
                        <span className="attributeValues">
                          {openParenthesis}
                          <span className="attributeValue" onClick={() => { this.setFilter([filter], {action:"deselect-option", option: {"label": "", value, group:filter}}) }}>{value}</span>
                          {addOr}
                          {closeParenthesis}
                        </span>
                      )})}
                      {addAnd}
                  </span>
                );
              })}
            </div>

            <div className={"summary"}>
              <div>
                <strong>Summary:</strong>
              </div>

              <div>{this.filteredFiles.length} Files</div>

              <div>
                {
                  _.keys(this.getGroupsByPropertyFiltered[PropNames.AtlasName])
                    .length
                }{" "}
                Atlases
              </div>

              <div>
                {
                  _.keys(
                    this.getGroupsByPropertyFiltered[
                      PropNames.TissueorOrganofOrigin
                    ]
                  ).length
                }{" "}
                Organs
              </div>

              <div>
                {
                  _.keys(
                    this.getGroupsByPropertyFiltered[PropNames.PrimaryDiagnosis]
                  ).length
                }{" "}
                Cancer Types
              </div>

              <div>{patients} Cases</div>

              <div>
                {
                  _(this.filteredFiles)
                    .map((f) => f.HTANParentBiospecimenID)
                    .uniq()
                    .value().length
                }{" "}
                Biospecimens
              </div>

              <div>
                {
                  _.keys(this.getGroupsByPropertyFiltered[PropNames.Component])
                    .length
                }{" "}
                Assays
              </div>
            </div>
            <FileTable entities={this.filteredFiles}></FileTable>
            <Button href="/explore" variant="primary" className="mr-4">
              Download
            </Button>
          </div>

          <div
            className={`tab-content atlasTab ${
              this.state.activeTab !== "atlas" ? "d-none" : ""
            }`}
          >
            <WPAtlasTable atlasData={this.props.wpData} />
          </div>
        </div>
      );
    }
  }
};

interface IFilterPageProps {
  atlasData: any;
}

const FilterPage = (props: IFilterPageProps) => {
  return (
    <>
      <HtanNavbar />

      <Search wpData={props.atlasData} />

      <Footer />
    </>
  );
};

export default FilterPage;
