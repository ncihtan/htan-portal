import react from '@vitejs/plugin-react';
import path from 'path';
import { Plugin } from 'vite';
import dts from 'vite-plugin-dts';
import { externals } from 'rollup-plugin-node-externals';

export function nodeExternals(): Plugin {
    return {
        enforce: 'pre',
        ...externals({
            // Workaround for problematic dependencies when defined as external.
            // we have to bundle these dependencies together with the library (exclude from being external)
            exclude: ['react-spinners'],
        }),
    };
}

export function getConfig(dirName: string, libName: string) {
    return {
        plugins: [
            nodeExternals(),
            react({
                // seems like classic runtime is needed for react versions prior to 18
                // we may want to remove 'jsxRuntime' option when we upgrade all our projects to react 18+
                jsxRuntime: 'classic',
                babel: {
                    parserOpts: {
                        plugins: ['decorators-legacy', 'classProperties'],
                    },
                },
            }),
            dts({
                insertTypesEntry: true,
            }),
        ],
        build: {
            lib: {
                entry: path.resolve(dirName, 'src/index.ts'),
                name: libName,
                formats: ['es', 'cjs'],
                fileName: (format: string) => `index.${format}.js`,
            },
            rollupOptions: {
                external: [
                    'mobx',
                    'mobx-react',
                    'path',
                    'react',
                    'react-dom',
                    'styled-components',
                    // treat any @htan package as external to avoid redundant bundling
                    /^@htan*/,
                    // this is a workaround, nodeExternals cannot identify victory modules as external
                    /^victory*/,
                ],
                output: {
                    globals: {
                        jquery: '$',
                        lodash: '_',
                        react: 'React',
                        'react-dom': 'ReactDOM',
                        'styled-components': 'styled',
                    },
                },
            },
        },
    };
}
