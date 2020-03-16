import useSWR from "swr";
import _ from "lodash";
import fetch from "unfetch";

export function fetcher(url: string) {
    return fetch(url).then(r => r.json());
}

export function getContent(tab: string, htaId: string) {
    let overviewURL = `https://humantumoratlas.org/wp-json/wp/v2/pages/?slug=${htaId}-${tab}&_fields=content,slug,title`;
    let {data} = useSWR(overviewURL, fetcher);
    let post = _.filter(data, (o) => o.slug === `${htaId}-${tab}`);

    return post[0] ? post[0].content.rendered : "";
}
