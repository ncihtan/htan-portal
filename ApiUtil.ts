import useSWR from "swr";
import _ from "lodash";
import fetch from "unfetch";

export function fetcher(url: string) {
    return fetch(url).then(r => r.json());
}

export function getContent(tab: string, htaId: string) {
    let overviewURL = `${WORDPRESS_BASE_URL}${htaId}-${tab}`;
    let {data} = useSWR(overviewURL, fetcher);
    let post = _.filter(data, (o) => o.slug === `${htaId}-${tab}`);

    return post[0] ? post[0].content.rendered : "";
}


export const WORDPRESS_BASE_URL = `https://humantumoratlas.org/wp-json/wp/v2/pages/?_fields=content,slug,title&cacheBuster=${new Date().getTime()}&slug=`
