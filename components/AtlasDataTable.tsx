import React from "react";
import {Table} from "react-bootstrap";
import _ from 'lodash';
import {SubCategory} from "../types";
import Tooltip from "rc-tooltip";

type AtlasDataTableProps = {
    subcategoryData:SubCategory
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
                subcategoryData.data.values.map((vals, i)=>{
                    const att = atts[i];
                    const meta = {}
                    if (att && att.schemaMetadata) {
                        const meta = JSON.stringify(att.schemaMetadata);
                    }
                    if (vals && _.isArray(vals)) {
                        return <tr key={i}>
                            {
                                vals.map((val: any, i: number) => {
                                        return <td key={`${i}`}>
                                            <Tooltip visible={false} overlay={meta}>
                                                <span>{val}</span>
                                            </Tooltip>
                                        </td>
                                    }
                                )
                            }
                        </tr>
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
