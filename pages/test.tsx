import React from "react";

import HtanNavbar from "../components/HtanNavbar";
import HomePage, {IHomePropsProps} from "../components/HomePage";
import Footer from "../components/Footer";
import { GetStaticProps} from "next";
import fetch from "node-fetch";
import { WPConstants} from "../types";
import {getContent, WORDPRESS_BASE_URL} from "../ApiUtil";
import _ from 'lodash';
import {doIt, entity} from "./lib/helpers";

enum PropNames {
    TissueorOrganofOrigin = "TissueorOrganofOrigin",
    PrimaryDiagnosis = "PrimaryDiagnosis",
    Component = "Component"
}

const propMap = {
    [PropNames.TissueorOrganofOrigin]: {
        prop: "diagnosis.TissueorOrganofOrigin"
    }, 
    [PropNames.PrimaryDiagnosis]: {
        prop: "diagnosis.PrimaryDiagnosis"
    }, 
    [PropNames.Component]: {
        prop: "Component"
    }   
}

class Moo extends React.Component<{},{files:entity[], selectedDiagnsis:string|undefined, selectedOrgan:string|undefined}> {

    constructor(props){
        super(props);
        this.state = { files:[], filters:{}, selectedOrgan:undefined };
    }

    get getGroupsByProperty(){
        const m = {};
        _.forEach(propMap, (o, k)=>{
            console.log(o.prop);
            m[k] = _.groupBy(this.state.files,(f)=>{
                const val  = _.at(f, [o.prop]);
                return val ? val[0] : "other"; 
            });
        });
        return m;
    }

    setFilter(name, val){
        console.log("filters", name);
        const filters = Object.assign({}, this.state.filters);
        if (val) {
            filters[name] = val;
        } else {
            delete filters[name];
        }
        this.setState({filters:filters});
    }

    componentDidMount(): void {

        const data = doIt().then((files)=>{

            console.log(files);

            const filteredFiles = files.filter((f)=>!!f.diagnosis);

            this.setState({files:filteredFiles})
        });
    }

    get filteredFiles(){
        // if (this.state.selectedOrgan) {
        //     return this.state.files.filter((f)=>f.diagnosis.TissueorOrganofOrigin === this.state.selectedOrgan);
        // } else {
        //     return this.state.files;
        // }
        if (_.size(this.state.filters)) {
            return this.state.files.filter((f)=>{
                return _.every(this.state.filters,(filter, name)=>{
                    const val = _.at(f,propMap[name].prop);
                    return val ? val[0] === filter : false;
                });
            });
        } else {
            return this.state.files;
        }
    }

    render(){

        var self = this;

        console.log("filter", this.state.filters);


        if (this.filteredFiles) {

            return <div style={{padding:20}}>
                
                <div className={'summary'}>
                   
                    <div>
                        {this.state.files.length} Files
                    </div>

                    <div>
                        {_.keys(this.getGroupsByProperty[PropNames.TissueorOrganofOrigin]).length} Organs
                    </div>

                    <div>
                        {_.keys(this.getGroupsByProperty[PropNames.PrimaryDiagnosis]).length} Cancer Types
                    </div>

                    <div>
                        {_.keys(this.getGroupsByProperty[PropNames.Component]).length} Assays
                    </div>

                </div>


                <div className="filterControls">
                    
                    <select className="form-control" placeholder="helo"  style={{marginBottom:20, maxWidth:200}} onChange={function(e) {
                        self.setFilter(PropNames.TissueorOrganofOrigin, e.target.value)
                    }.bind(this)}>
                        {
                            _.map(this.getGroupsByProperty[PropNames.TissueorOrganofOrigin],(val, key)=>{
                            return <option value={key}>{key} ({val.length})</option>
                            })
                        }
                    </select>

                    <select className="form-control"  style={{marginBottom:20, maxWidth:200}} onChange={function(e) {
                        self.setFilter(PropNames.PrimaryDiagnosis, e.target.value);
                        //this.setState({selectedDiagnosis: e.target.value})
                    }}>
                        {
                            _.map(this.getGroupsByProperty[PropNames.PrimaryDiagnosis],(val, key)=>{
                            return <option value={key}>{key} ({val.length})</option>
                            })
                        }
                    </select>

                    <select className="form-control"  style={{marginBottom:20, maxWidth:200}} onChange={function(e) {
                        self.setFilter(PropNames.Component, e.target.value);
                        //this.setState({selectedDiagnosis: e.target.value})
                    }}>
                        {
                            _.map(this.getGroupsByProperty[PropNames.Component],(val, key)=>{
                            return <option value={key}>{key.replace(/^bts:/,"")} ({val.length})</option>
                            })
                        }
                    </select>        

                </div>

                <ResultTable entities={this.filteredFiles}>
                </ResultTable>
            </div>

            // return <table className={"table"}>
            //     <thead>
            //         <tr>
            //             <th>Filename</th>
            //             <th>Atlas</th>
            //             <th>Organ</th>
            //             <th>Filename</th>
            //         </tr>
            //     </thead>
            //     <tbody>
            //     {
            //         this.state.files.map((file)=>{
            //            return <tr>
            //                <td>{file.filename}</td>
            //                <td>{file.atlasid}</td>
            //                <td>{ file.diagnosis && file.diagnosis.TissueorOrganofOrigin}</td>
            //                <td>{file.atlasid}</td>
            //            </tr>
            //         })
            //     }
            //     </tbody>
            // </table>
        }
    }

}


class ResultTable extends React.Component<{entities:entity[]},{filteredEntitites:entity[]}> {

    constructor(props){
        super(props);
        //this.state = { filteredEntitites:[] };
    }

    componentDidMount(): void {

    }

    render(){
        if (this.props.entities) {
            return <table className={"table"}>
                <thead>
                <tr>
                    <th>Filename</th>
                    <th>Atlas</th>
                    <th>Assay</th>
                    <th>Organ</th>
                    <th>Diagnosis</th>
                   
                </tr>
                </thead>
                <tbody>
                {
                    this.props.entities.map((file)=>{
                        return <tr>
                            <td>{file.filename}</td>
                            <td>{file.atlasid}</td>
                            <td>{file.Component.replace(/^bts:/,"")}</td>
                            <td>{ file.diagnosis && file.diagnosis.TissueorOrganofOrigin}</td>
                            <td>{ file.diagnosis && file.diagnosis.PrimaryDiagnosis}</td>
                        </tr>
                    })
                }
                </tbody>
            </table>
        }
    }

}




const Test = (data: IHomePropsProps) => {
    return (
        <>

                <HtanNavbar/>
                    <Moo/>
                <Footer/>


        </>
    );
}


export default Test;
