import { assertScreenshotMatch, getUrl } from '../lib/spec_utils.mjs';

describe('explore page', () => {
    it('render initial unfiltered state of explore page', async () => {
        await browser.url(getUrl('/explore'));
        const result = await browser.checkElement('body', [{}]);
        assertScreenshotMatch(result);
    });
});
