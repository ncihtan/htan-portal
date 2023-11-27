const withMDX = require('@next/mdx')({
    extension: /\.mdx?$/,
});
module.exports = withMDX({
    swcMinify: true,
    pageExtensions: ['js', 'jsx', 'mdx', 'tsx'],
    redirects: async () => {
        // Note: don't put trailing slash in the redirect URLs
        return [
            {
                source: '/htan-authors',
                destination: '/authors',
                permanent: true,
            },
        ];
    },
});
