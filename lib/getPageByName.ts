import matter from 'gray-matter';
import fs from 'fs';
const path = require('path');

const docsDirectory = path.join(process.cwd(), 'pages/static');

export function getPageByPageName(name) {
    const realSlug = name.replace(/\.md$/, '');
    const fullPath = path.join(docsDirectory, `${realSlug}.mdx`);
    const fileContents = fs.readFileSync(fullPath, 'utf8');
    return fileContents;
}
