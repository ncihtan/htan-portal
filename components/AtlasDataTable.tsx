import React from "react";
import {Table} from "react-bootstrap";
import _ from 'lodash';
import {SubCategory} from "../types";

type AtlasDataTableProps = {
    subcategoryData:SubCategory
}

export const AtlasDataTable: React.FunctionComponent<AtlasDataTableProps> = ({ subcategoryData }) => {

    const atts = subcategoryData.data.attributes;

    return <div>
        <table className={"table table-striped"}>
            <thead>
            <tr>
            {
                atts.map((att)=><th key={att.name}>{att.description}</th>)
            }
            </tr>
            </thead>
            <tbody>
            {
                subcategoryData.data.values.map((vals,i)=><tr key={i}>
                    {
                        vals.map((val:any,i:number)=><td key={`cell${i}`}>{val}</td>)
                    }
                </tr>)
            }
            </tbody>
        </table>
    </div>;
}
