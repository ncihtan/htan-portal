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




class Moo extends React.Component<{},{files:entity[], selectedOrgan:string|undefined}> {

    constructor(props){
        super(props);
        this.state = { files:[], selectedOrgan:undefined };
    }

    get organTypes() {
        return _(this.state.files).map((f)=>f.diagnosis.TissueorOrganofOrigin).uniq().value()
    }

    componentDidMount(): void {

        const data = doIt().then((files)=>{

            const filteredFiles = files.filter((f)=>!!f.diagnosis);

            this.setState({files:filteredFiles})
        });
    }

    get filteredFiles(){
        if (this.state.selectedOrgan) {
            return this.state.files.filter((f)=>f.diagnosis.TissueorOrganofOrigin === this.state.selectedOrgan);
        } else {
            return this.state.files;
        }
    }

    render(){

        if (this.filteredFiles) {


            return <div style={{padding:20}}>
                <select className="form-control"  style={{marginBottom:20}} onChange={function(e) {
                    this.setState({selectedOrgan: e.target.value})
                }.bind(this)}>
                    {
                        this.organTypes.map((organ)=><option>{organ}</option>)
                    }
                </select>

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
                    <th>Organ</th>
                    <th>Filename</th>
                </tr>
                </thead>
                <tbody>
                {
                    this.props.entities.map((file)=>{
                        return <tr>
                            <td>{file.filename}</td>
                            <td>{file.atlasid}</td>
                            <td>{ file.diagnosis && file.diagnosis.TissueorOrganofOrigin}</td>
                            <td>{file.atlasid}</td>
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
