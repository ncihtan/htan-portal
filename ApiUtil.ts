import useSWR from "swr";
import _ from "lodash";
import fetch from "node-fetch";

export interface WPAtlas {
    id:number;
    slug:string;
    title: { rendered:string };
    content: { rendered:string };
    atlas_overview: string;
    data_overview: string;
    publications: string;
    lead_institutions: string;
    atlas_type: string;
    synapse_id: string;
}

export function fetcher(url: string) {
    return fetch(url).then(r => r.json());
}

export function getContent(tab: string, htaId: string) {
    let overviewURL = `${WORDPRESS_BASE_URL}${htaId}-${tab}`;
    let {data} = useSWR(overviewURL, fetcher);
    let post = _.filter(data, (o) => o.slug === `${htaId}-${tab}`);

    return post[0] ? post[0].content.rendered : "";
}

export function getAtlasContent(postId: number): WPAtlas {
    let postUrl = `https://humantumoratlas.org/wp-json/wp/v2/atlas/${postId}`;
    let {data} = useSWR(postUrl, fetcher);
    return (data as WPAtlas);
}

export function getAtlasList() : Promise<WPAtlas[]> {
    let postUrl = `https://humantumoratlas.org/wp-json/wp/v2/atlas`;
    return fetcher(postUrl);
    //return (data as WPAtlas[]);
}


export const WORDPRESS_BASE_URL = `https://humantumoratlas.org/wp-json/wp/v2/pages/?_fields=content,slug,title&cacheBuster=${new Date().getTime()}&slug=`
