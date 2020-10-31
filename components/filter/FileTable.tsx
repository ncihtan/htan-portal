import React from "react";
import { Atlas, Entity } from "../../lib/helpers";


export default class FileTable extends React.Component<{entities:Entity[]},{filteredEntitites:Entity[]}> {

    constructor(props:any){
        super(props);
        //this.state = { filteredEntitites:[] };
    }

    componentDidMount(): void {

    }

    render(){
        if (this.props.entities) {
            return <table className={"table table-striped"}>
                <thead>
                <tr>
                    <th><input type="checkbox"></input></th>
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
                            <td><input type="checkbox"></input></td>
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