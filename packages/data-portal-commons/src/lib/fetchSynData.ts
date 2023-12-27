import fetch from 'node-fetch';
import { LoadDataResult } from './types';

export async function fetchSynData(
    processedSynURL: string
): Promise<LoadDataResult> {
    const res = await fetch(processedSynURL);

    // const json = await res.json();
    const text = await res.text();
    const json = JSON.parse(text);

    //window.myJSON = JSON.parse(text);

    return json as LoadDataResult;
}

export function fetchDefaultSynData(): Promise<LoadDataResult> {
    return fetchSynData('/processed_syn_data.json');
}
