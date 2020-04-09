import React, {useState} from "react";
import {Table} from "react-bootstrap";
import _ from 'lodash';
import {AtlasDataTable} from "./AtlasDataTable";
import Container from "react-bootstrap/Container";
import {Category} from "../types";

export const AtlasWrapper: React.FunctionComponent<{ category: Category }> = ({category}) => {

    const subCats = Object.keys(category);

    subCats.sort();

    const [selectedCategory, setCategory] = useState(Object.keys(category)[0]);

    return <div>
        <div style={{display: "flex", marginBottom:20}}>
            <select defaultValue={selectedCategory} onChange={(e)=>setCategory(e.target.value)} className={"form-control"} style={{marginRight: 10}}>
                {
                    _.map(subCats, ((k) => {
                        return <option>{k}</option>
                    }))
                }
            </select>

            <a href={category[selectedCategory].dataLink} className={`btn btn-primary`}>
                Download
            </a>
        </div>
        <AtlasDataTable subcategoryData={category[selectedCategory]}/>
    </div>

}
