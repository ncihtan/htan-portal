import Link from 'next/link';
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
                <th>
                    
                </th>
            </tr>
        </thead> 
        <tbody>
             {
                props.atlasData.map((atlas)=>{
                    return <tr>
                        <td>{atlas.title.rendered}</td>
                        <td>{atlas.lead_institutions}</td>
                        <td>
                        <Link href={`./atlas/${atlas.htan_id.toLowerCase()}`}>
                     <a>Data Release</a>
                   </Link>

                        </td>
                    </tr>
                })
            }
        </tbody>
    </table>
};