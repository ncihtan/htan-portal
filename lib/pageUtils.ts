import matter from 'gray-matter';
import fs from 'fs';
const path = require('path');

const docsDirectory = path.join(process.cwd(), 'pages/static');

export function getPageByPageName(name: string) {
    const realSlug = name.replace(/\.md$/, '');
    const fullPath = path.join(docsDirectory, `${realSlug}.html`);
    const fileContents = fs.readFileSync(fullPath, 'utf8');
    return fileContents;
}

export function getAllPages() {
    const contents = fs.readdirSync(docsDirectory);

    const metadata = contents.map((filename) => {
        const fullPath = path.join(docsDirectory, filename);
        const fileContents = fs.readFileSync(fullPath, 'utf8');
        return matter(fileContents);
    });

    return metadata;
}
