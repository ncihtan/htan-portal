import useSWR from 'swr';
import _ from 'lodash';
import fetch from 'node-fetch';
import { WPAtlas } from './types';

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
    let postUrl = `https://humantumoratlas.org/wp-json/wp/v2/atlas/${postId}`;
    let { data } = useSWR(postUrl, fetcher);
    return data as WPAtlas;
}

export function getAtlasList(): Promise<WPAtlas[]> {
    let postUrl = `https://humantumoratlas.org/wp-json/wp/v2/atlas?per_page=100`;
    return fetcher(postUrl);
}

export async function getStaticContent(slugs: string[]) {
    const overviewURL = `${WORDPRESS_BASE_URL}${JSON.stringify(slugs)}`;
    const res = await fetch(overviewURL);

    return res.json();
}

export const WORDPRESS_BASE_URL = `https://humantumoratlas.org/wp-json/wp/v2/pages/?_fields=content,slug,title&cacheBuster=${new Date().getTime()}&slug=`;
