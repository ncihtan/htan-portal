import data from '../public/syn_data.json';
import { SynapseData } from '@htan/data-portal-commons';

export default function getData() {
    return (data as unknown) as SynapseData;
}
