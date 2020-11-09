import React from "react";
import HtanNavbar from "../components/HtanNavbar";
import Footer from "../components/Footer";
import _ from "lodash";
import { loadData, Entity, Atlas } from "../lib/helpers";
import AtlasTable from "../components/filter/AtlasTable";
import FileTable from "../components/filter/FileTable";
import FilterSelection from "../components/filter/FilterSelection";
import Select from "react-select";

enum PropNames {
  TissueorOrganofOrigin = "TissueorOrganofOrigin",
  PrimaryDiagnosis = "PrimaryDiagnosis",
  Component = "Component",
  Biospecimen = "Biospecimen",
}

const propMap = {
  [PropNames.TissueorOrganofOrigin]: {
    prop: "diagnosis.TissueorOrganofOrigin",
  },
  [PropNames.PrimaryDiagnosis]: {
    prop: "diagnosis.PrimaryDiagnosis",
  },
  [PropNames.Component]: {
    prop: "Component",
  },
  [PropNames.Biospecimen]: {
    prop: "Biospecimen",
  },
};

interface IFilterProps {
  files: Entity[];
  filters: { [key: string]: string[] };
  atlases: Atlas[];
}

class Search extends React.Component<{}, IFilterProps> {
  constructor(props: any) {
    super(props);
    this.state = { files: [], filters: {}, atlases: [] };
  }

  get getGroupsByProperty() {
    const m: { [k: string]: any } = {};
    _.forEach(propMap, (o, k) => {
      m[k] = _.groupBy(this.state.files, (f) => {
        //@ts-ignore
        const val: string[] = _.at(f, [o.prop]);
        return val ? val[0] : "other";
      });
    });
    return m;
  }

  get getGroupsByPropertyFiltered() {
    const m: any = {};
    _.forEach(propMap, (o, k) => {
      console.log(o.prop);
      m[k] = _.groupBy(this.filteredFiles, (f) => {
        //@ts-ignore
        const val = _.at(f, [o.prop]);
        return val ? val[0] : "other";
      });
    });
    return m;
  }

  setFilter(name: string, val: any) {
    const filters = Object.assign({}, this.state.filters);
    if (val) {
      filters[name] = val;
    } else {
      delete filters[name];
    }
    this.setState({ filters: filters });
  }

  componentDidMount(): void {
    const data = loadData().then(({ files, atlases }) => {
      const filteredFiles = files.filter((f) => !!f.diagnosis);

      this.setState({ files: filteredFiles, atlases: atlases });
    });
  }

  get filteredFiles() {
    console.log(this.state.filters);
    if (_.size(this.state.filters)) {
      return this.state.files.filter((f) => {
        return _.every(this.state.filters, (filter, name) => {
          //@ts-ignore
          const val = _.at(f, propMap[name].prop);
          //@ts-ignore
          return val ? filter.includes(val[0]) : false;
        });
      });
    } else {
      return this.state.files;
    }
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
                <a className="nav-link" href="#">
                  Atlas View
                </a>
              </li>
              <li className="nav-item">
                <a className="nav-link active" href="#">
                  File View
                </a>
              </li>
            </ul>
          </div>

          <div className="fileTab">
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
                Organ:&nbsp;
                <div style={{ width: 300 }}>
                  <Select
                    isClearable
                    isSearchable
                    name="color"
                    isMulti={true}
                    options={_.map(
                      this.getGroupsByProperty[PropNames.TissueorOrganofOrigin],
                      (val, key) => {
                        return { value: key, label: `${key} (${val.length})` };
                      }
                    )}
                    hideSelectedOptions={false}
                    closeMenuOnSelect={false}
                    onChange={
                      //@ts-ignore
                      (e: any) => {
                        //@ts-ignore
                        this.setFilter(
                          PropNames.TissueorOrganofOrigin,
                          e ? e.map((option: any) => option.value) : []
                        );
                      }
                    }
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
                Diagnosis:&nbsp;
                <div style={{ width: 300 }}>
                  <Select
                    isClearable
                    isSearchable
                    name="color"
                    isMulti={true}
                    options={_.map(
                      this.getGroupsByProperty[PropNames.PrimaryDiagnosis],
                      (val, key) => {
                        return { value: key, label: `${key} (${val.length})` };
                      }
                    )}
                    hideSelectedOptions={false}
                    closeMenuOnSelect={false}
                    onChange={
                      //@ts-ignore
                      (e: any) => {
                        //@ts-ignore
                        this.setFilter(
                          PropNames.PrimaryDiagnosis,
                          e ? e.map((option: any) => option.value) : []
                        );
                      }
                    }
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
                Assay:&nbsp;
                <div style={{ width: 300 }}>
                  <Select
                    isClearable
                    isSearchable
                    name="color"
                    isMulti={true}
                    options={_.map(
                      this.getGroupsByProperty[PropNames.Component],
                      (val, key) => {
                        return { value: key, label: `${key} (${val.length})` };
                      }
                    )}
                    hideSelectedOptions={false}
                    closeMenuOnSelect={false}
                    onChange={
                      //@ts-ignore
                      (e: any) => {
                        //@ts-ignore
                        this.setFilter(
                          PropNames.Component,
                          e ? e.map((option: any) => option.value) : []
                        );
                      }
                    }
                  />
                </div>
              </div>
            </div>

            <div className={"summary"}>
              <div>
                <strong>Summary:</strong>
              </div>

              <div>{this.filteredFiles.length} Files</div>

              <div>
                {
                  _.keys(
                    this.getGroupsByPropertyFiltered[PropNames.PrimaryDiagnosis]
                  ).length
                }{" "}
                Cancer Types
              </div>

              <div>{patients} Participants</div>

              <div>
                {
                  _(this.filteredFiles)
                    .map((f) => f.HTANParentBiospecimenID)
                    .uniq()
                    .value().length
                }{" "}
                Biospecimen
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
                  _.keys(this.getGroupsByPropertyFiltered[PropNames.Component])
                    .length
                }{" "}
                Assays
              </div>
            </div>
            <FileTable entities={this.filteredFiles}></FileTable>
          </div>

          <div className="atlasTab">
            <AtlasTable atlases={this.state.atlases} />
          </div>
        </div>
      );
    }
  }
}

const FilterPage = () => {
  return (
    <>
      <HtanNavbar />
      <Search />
      <Footer />
    </>
  );
};

export default FilterPage;
