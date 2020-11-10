import React from 'react';
import { WPAtlas } from '../../types';

interface IWPAtlasTable {
    atlasData:WPAtlas[]
}

export const WPAtlasTable = (props:IWPAtlasTable) => {

    return <table className="table table-striped">    
        <thead>
            <tr>
                <th>
                    Atlas
                </th>
                <th>
                    Lead Institution
                </th>
            </tr>
        </thead> 
        <tbody>
             {
                props.atlasData.map((atlas)=>{
                    console.log(atlas);
                    return <tr>
                        <td>{atlas.title.rendered}</td>
                        <td>{atlas.lead_institutions}</td>
                    </tr>
                })
            }
        </tbody>
    </table>
};