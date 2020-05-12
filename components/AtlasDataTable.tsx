import React from "react";
import {Table} from "react-bootstrap";
import _ from 'lodash';
import {SubCategory, Attribute} from "../types";
import Tooltip from "rc-tooltip";
import { isArray } from "util";


type AtlasDataTableProps = {
    subcategoryData:SubCategory
}

function renderTableCellValue(att:Attribute, val:any): JSX.Element {

    let renderType = null;

    if (att && typeof(att.schemaMetadata) === 'object' && att.schemaMetadata.renderType) {
        renderType = att.schemaMetadata.renderType;
    }

    switch(renderType) {

        case "href":
            return <a target={"_blank"} href={val}>{val}</a>;
        case "scBrowser":
            return  <a href={`${val}`.replace("https://humantumoratlas.org/","/")}>View</a>;
        case "dsaImage":
            return <a href={`/image_viewer?u=${encodeURIComponent(val)}`.replace("https://humantumoratlas.org/","/")}>View</a>
        case "dsaThumbnail":
            return <img className={"dsa-thumb"} src={val} />

        default:
            return <span>{val}</span>;
    }

}

export const AtlasDataTable: React.FunctionComponent<AtlasDataTableProps> = ({ subcategoryData }) => {

    const atts = subcategoryData.data.attributes;
    if (atts.length > 0) {
        return <div style={{'overflowX': 'auto'}} >
        <table className={"table table-striped"}>
            <thead>
            <tr>
            {
                atts.map(att=><th className={`col_${att.name.replace(' ', '_').toLowerCase()}`} key={att.name}>
                    <Tooltip overlay={att.description}>
                        <span>{att.name}</span>
                    </Tooltip>
                </th>)
            }
            </tr>
            </thead>
            <tbody>
            {
                subcategoryData.data.values.map((vals,i)=>{
                    if (vals && _.isArray(vals)) {
                        return (<tr key={i}>
                                {vals.map((val:any,j:number) => {
                                    const att = atts[j];
                                    const meta = (att && att.schemaMetadata)? JSON.stringify(att.schemaMetadata) : JSON.stringify({});

                                    return (
                                        <td key={`cell${j}`}>
                                            <Tooltip visible={false} overlay={meta}>
                                                {renderTableCellValue(att, val)}
                                            </Tooltip>
                                        </td>
                                    );
                                })}
                            </tr>
                        );
                    } else {
                        console.log(vals);
                        return null;
                    }
                })
            }
            </tbody>
        </table>
    </div>;
    } else {
        return <div style={{textAlign: 'center'}}>No columns selected. Please selected a column</div>
    }

}
