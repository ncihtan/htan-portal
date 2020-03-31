import React from "react";
import {Table} from "react-bootstrap";
import _ from 'lodash';

type AtlasDataTableProps = {
    subcategoryData:SubCategory
}

export interface SubCategory {
    data: {
        attributes:any[];
        values:any[];
    };
    dataLink:string;
};


export interface Category {
    [subcat:string]:SubCategory
}

export interface Atlas {
    clinical: Category,
    biospecimen: Category,
    assayData: Category,
    imagingData: Category,
};

export const AtlasDataTable: React.FunctionComponent<AtlasDataTableProps> = ({ subcategoryData }) => {

    // this is just until data is fixed;
    // const atts = _.map(subcategoryData.data.attributes,(v,k)=>{
    //     const ret = v[Object.keys(v)[0]];
    //     ret.name = Object.keys(v)[0];
    //     return ret;
    // });

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
