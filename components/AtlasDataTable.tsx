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

    return <div>
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
                    const att = atts[i];
                    const meta = JSON.stringify(att.schemaMetadata || {});

                    return <tr key={i}>
                        {
                            vals.map((val:any, i:number)=> {
                                const thead = subcategoryData.data.attributes[i].name.replace(' ', '_').toLowerCase();
                                return <td key={`${i}`} className={`col_${thead}`}>
                                            <Tooltip visible={false} overlay={meta}>
                                                <span>{val}</span>
                                            </Tooltip>
                                        </td>
                            }
                            )
                        }
                    </tr>
                })
            }
            </tbody>
        </table>
    </div>;
}
