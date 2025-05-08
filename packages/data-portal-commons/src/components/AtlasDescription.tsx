import React from 'react';
import { AtlasMeta } from '../lib/entity';

export const AtlasDescription: React.FunctionComponent<{
    atlasMeta: AtlasMeta;
    atlasName?: string;
}> = (props) => {
    return !['hta13', 'hta14', 'hta15'].includes(
        props.atlasMeta.htan_id?.toLowerCase()
    ) ? (
        <span>
            <a href={`/center/${props.atlasMeta.htan_id.toLowerCase()}`}>
                {props.atlasName || props.atlasMeta?.title?.rendered}
            </a>
        </span>
    ) : (
        <span>{props.atlasMeta?.short_description}</span>
    );
};

export default AtlasDescription;
