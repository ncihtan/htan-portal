import data from '../public/syn_data.json';
import { SynapseData } from './types';

export default function getData() {
    return (data as unknown) as SynapseData;
}
