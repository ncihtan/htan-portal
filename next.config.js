/* eslint-disable @typescript-eslint/no-var-requires */
/* See https://github.com/vercel/next.js/issues/12735#issuecomment-629404102 */

const ForkTsCheckerWebpackPlugin = require('fork-ts-checker-webpack-plugin');

module.exports = {
    /**
     * Custom Webpack Config
     * https://nextjs.org/docs/api-reference/next.config.js/custom-webpack-config
     */
    webpack(config, options) {
        const { dev, isServer } = options;

        // Do not run type checking twice:
        if (dev && isServer) {
            config.plugins.push(new ForkTsCheckerWebpackPlugin());
        }

        return config;
    },
};
