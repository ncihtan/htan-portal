import metaData from '../data/syn_metadata.json';

export default function getAtlasMetaData() {
    return (metaData as any) as {
        [atlasId: string]: {
            [attributeId: string]: {
                synapseId: string;
                numItems: number;
            };
        };
    };
}
