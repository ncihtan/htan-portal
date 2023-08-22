import useSWR from 'swr';
import _ from 'lodash';
import fetch from 'node-fetch';
import { WPAtlas } from './types';
import { resolve } from 'path';

export function fetcher(url: string) {
    return fetch(url).then((r) => r.json());
}

export async function getContent(tab: string, htaId: string) {
    let overviewURL = `${WORDPRESS_BASE_URL}${htaId}-${tab}`;
    let data = await fetcher(overviewURL);
    let post = _.filter(data, (o) => o.slug === `${htaId}-${tab}`);
    return post[0] ? post[0].content.rendered : '';
}

export function getAtlasContent(postId: number): WPAtlas {
    let postUrl = `https://humantumoratlas.wpcomstaging.com/wp-json/wp/v2/atlas/${postId}`;
    let { data } = useSWR(postUrl, fetcher);
    return data as WPAtlas;
}

export async function getAtlasList(): Promise<WPAtlas[]> {
    const wpAtlases = await getAtlasListWordPressOnly();
    //TODO: need to make all atlases static rather than coming from WP
    const staticAtlases: WPAtlas[] = [
        {
            id: 9999,
            title: { rendered: 'TNP SARDANA' },
            htan_id: 'hta13',
            slug: 'tnp-sardana',
            atlas_overview: '',
            data_overview: '',
            lead_institutions: 'Trans-Network Project',
            synapse_id: 'syn24984270',
            content: { rendered: '' },
            publications: '',
            atlas_type: 'Other',
            primary_ngs: '',
            short_description: 'Compare imaging methods across centers',
            // TODO: hash out which ones are required
            home_image: { guid: '' },
        },
        {
            id: 9998,
            title: { rendered: 'TNP TMA' },
            htan_id: 'hta14',
            slug: 'tnp-tma',
            atlas_overview: '',
            data_overview: '',
            lead_institutions: 'Trans-Network Project',
            synapse_id: 'syn22041595',
            content: { rendered: '' },
            publications: '',
            atlas_type: 'Other',
            primary_ngs: '',
            short_description: 'Generate spatially resolved cell type/state census from tissue microarray breast FFPE specimens',
            // TODO: hash out which ones are required
            home_image: { guid: '' },
        },
    ];
    return wpAtlases.concat(staticAtlases);
}

export function getAtlasListWordPressOnly(): Promise<WPAtlas[]> {
    let postUrl = `https://humantumoratlas.wpcomstaging.com/wp-json/wp/v2/atlas?per_page=100`;
    return fetcher(postUrl);
}

export async function getStaticContent(slugs: string[]) {
    const overviewURL = `${WORDPRESS_BASE_URL}${JSON.stringify(slugs)}`;
    const res = await fetch(overviewURL);

    return res.json();
}

export const WORDPRESS_BASE_URL = `https://humantumoratlas.wpcomstaging.com/wp-json/wp/v2/pages/?_fields=content,slug,title&cacheBuster=${new Date().getTime()}&slug=`;
