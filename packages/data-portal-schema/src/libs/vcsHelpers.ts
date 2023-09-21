import fetch from 'node-fetch';
import semverCompare from 'semver/functions/compare';
import semverValid from 'semver/functions/valid';

export interface VcsTag {
    name: string;
    commit?: {
        sha: string;
        url: string;
    };
    node_id?: string;
}

// https://raw.githubusercontent.com/Sage-Bionetworks/schematic/main/data/schema_org_schemas/example.jsonld
// https://github.com/ncihtan/hsim/blob/master/schema/HTAN.jsonld
// export const DEFAULT_SCHEMA_URL =
//     'https://raw.githubusercontent.com/ncihtan/data-models/main/HTAN.model.jsonld';

export const DEFAULT_SCHEMA_REPO_NAME = 'ncihtan/data-models';
export const DEFAULT_SCHEMA_REPO_API = 'https://api.github.com/repos';
export const DEFAULT_SCHEMA_CONTENT_HOST = 'https://raw.githubusercontent.com';
export const DEFAULT_SCHEMA_RELEASE_TAG = 'main';
export const DEFAULT_SCHEMA_FILENAME = 'HTAN.model.jsonld';
export const DEFAULT_SCHEMA_API_URI = getSchemaApiUri();

export function getSchemaApiUri(
    repoName: string = DEFAULT_SCHEMA_REPO_NAME,
    repoApi: string = DEFAULT_SCHEMA_REPO_API
) {
    return `${repoApi}/${repoName}`;
}

export async function getLatestReleaseTag(
    repoApiUri: string = DEFAULT_SCHEMA_API_URI
): Promise<VcsTag> {
    try {
        const tagsEndpoint = `${repoApiUri}/tags`;
        const res = await fetch(tagsEndpoint);

        // const json = await res.json();
        const text = await res.text();
        const tags: VcsTag[] = JSON.parse(text);
        const versions = tags
            .filter((t) => semverValid(t.name))
            .sort((v1, v2) => semverCompare(v2.name, v1.name));

        return versions[0];
    } catch (e: any) {
        // console.error(`Invalid Url: ${repoApiUri}`);
        return { name: DEFAULT_SCHEMA_RELEASE_TAG };
    }
}

export function getLinkToRelease(
    tagName: string = DEFAULT_SCHEMA_RELEASE_TAG,
    repoName: string = DEFAULT_SCHEMA_REPO_NAME
) {
    return `https://github.com/${repoName}/releases/tag/${tagName}`;
}

export function getSchemaUrl(
    tag: string = DEFAULT_SCHEMA_RELEASE_TAG,
    repoName: string = DEFAULT_SCHEMA_REPO_NAME,
    contentHost: string = DEFAULT_SCHEMA_CONTENT_HOST,
    dataModelFilename: string = DEFAULT_SCHEMA_FILENAME
) {
    return `${contentHost}/${repoName}/${tag}/${dataModelFilename}`;
}

export async function getLatestReleaseSchemaUrl(
    repoUri: string = DEFAULT_SCHEMA_API_URI,
    repoName: string = DEFAULT_SCHEMA_REPO_NAME,
    contentHost: string = DEFAULT_SCHEMA_CONTENT_HOST,
    dataModelFilename: string = DEFAULT_SCHEMA_FILENAME
) {
    const tag = await getLatestReleaseTag(repoUri);

    return getSchemaUrl(tag.name, repoName, contentHost, dataModelFilename);
}
