// Detects publication id changes between a base and the current publications
// manifest, and adds redirects for the old ids to next.config.js.
// Usage: node scripts/updatePublicationRedirects.js <base-manifest.json>
// Keep getUid in sync with getPublicationUid in
// packages/data-portal-commons/src/lib/publicationHelpers.ts
const fs = require('fs');
const path = require('path');

const MANIFEST = path.join(__dirname, '../data/publications_manifest_all.json');
const CONFIG = path.join(__dirname, '../next.config.js');

const normalize = (v) =>
    (v || '').trim().toLowerCase().replace(/\s/g, '-').replace(/\./g, '');

function getUid(p) {
    const firstAuthor = normalize((p['Authors'] || '').split(',')[0]);
    return `${(p['HTAN Center ID'] || '').toLowerCase()}_${
        p['Year of Publication']
    }_${normalize(p['Location of Publication'])}_${firstAuthor}`;
}

const key = (p) =>
    `${p['HTAN Center ID']}|${(p['Title'] || '').trim().toLowerCase()}`;

const load = (f) =>
    JSON.parse(fs.readFileSync(f, 'utf8')).filter(
        (p) => p['Component'] === 'PublicationManifest'
    );

const oldByKey = new Map(load(process.argv[2]).map((p) => [key(p), p]));
const changes = [];
for (const p of load(MANIFEST)) {
    const old = oldByKey.get(key(p));
    if (!old) continue;
    const [from, to] = [getUid(old), getUid(p)];
    if (from !== to) changes.push([from, to]);
}

let config = fs.readFileSync(CONFIG, 'utf8');
const escapeRe = (v) => v.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Insert right after the last existing `/publications/` redirect object
function insertAfterLastPublicationRedirect(src, entry) {
    const lastSource = src.lastIndexOf("source: '/publications/");
    if (lastSource === -1) {
        throw new Error(
            'No existing /publications/ redirect found in next.config.js'
        );
    }
    const objectEnd = src.indexOf('},\n', lastSource);
    if (objectEnd === -1) {
        throw new Error(
            'Could not locate end of the last /publications/ redirect'
        );
    }
    const insertAt = objectEnd + '},\n'.length;
    return src.slice(0, insertAt) + entry + src.slice(insertAt);
}

for (const [from, to] of changes) {
    // retarget existing redirects pointing at the old id to avoid redirect chains
    config = config.replace(
        new RegExp(`(destination:\\s*)'/publications/${escapeRe(from)}'`, 'g'),
        `$1'/publications/${to}'`
    );

    if (!config.includes(`source: '/publications/${from}'`)) {
        const entry = `            {
                source: '/publications/${from}',
                destination:
                    '/publications/${to}',
                permanent: false,
            },
`;
        config = insertAfterLastPublicationRedirect(config, entry);
        console.log(`Added redirect: ${from} -> ${to}`);
    }
}

fs.writeFileSync(CONFIG, config);
if (changes.length === 0) console.log('No publication id changes detected');
