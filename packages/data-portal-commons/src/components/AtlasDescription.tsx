import React from 'react';
import { AtlasMeta } from '../lib/entity';

export function shouldIncludeAtlasHref(atlasMeta: AtlasMeta) {
    return !['hta13', 'hta14', 'hta15'].includes(
        atlasMeta.htan_id?.toLowerCase()
    );
}

export function getAtlasDescription(atlasMeta: AtlasMeta, atlasName?: string) {
    return shouldIncludeAtlasHref(atlasMeta)
        ? atlasName || atlasMeta?.title?.rendered
        : atlasMeta?.short_description;
}

export const AtlasDescription: React.FunctionComponent<{
    atlasMeta: AtlasMeta;
    atlasName?: string;
}> = (props) => {
    const atlasDescription = getAtlasDescription(
        props.atlasMeta,
        props.atlasName
    );
    return shouldIncludeAtlasHref(props.atlasMeta) ? (
        <span>
            <a href={`/center/${props.atlasMeta.htan_id.toLowerCase()}`}>
                {atlasDescription}
            </a>
        </span>
    ) : (
        <span>{atlasDescription}</span>
    );
};

export default AtlasDescription;
