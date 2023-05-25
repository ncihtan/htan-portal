import fetch from 'node-fetch';

export function fetcher(url: string) {
    return fetch(url).then((r) => r.json());
}
