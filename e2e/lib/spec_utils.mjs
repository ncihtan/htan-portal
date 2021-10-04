import assert from 'assert';

export function assertScreenshotMatch(obj) {
    return assert(
        obj[obj.length - 1].isWithinMisMatchTolerance,
        `screenshot mismatch ${obj[obj.length - 1].misMatchPercentage}`
    );
}

export function getUrl(path) {
    const host = process.env.HTAN_PORTAL_URL || 'http://localhost:3000';
    return `${host}${path}`;
}
