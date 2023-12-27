import metaData from '../data/syn_metadata.json';
import { AtlasMetaData } from '@htan/data-portal-commons';

export default function getAtlasMetaData(): AtlasMetaData {
    return metaData as AtlasMetaData;
}
