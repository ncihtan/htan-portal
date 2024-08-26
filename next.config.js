const withMDX = require('@next/mdx')({
    extension: /\.mdx?$/,
});
module.exports = withMDX({
    swcMinify: true,
    pageExtensions: ['js', 'jsx', 'mdx', 'tsx'],
    staticPageGenerationTimeout: 120,
    redirects: async () => {
        // Note: don't put trailing slash in the redirect URLs
        return [
            {
                source: '/htan-authors',
                destination: '/authors',
                permanent: true,
            },
            {
                source: '/publications/htapp_mbc_klughammer_2024',
                destination: '/publications/hta1_2024_pdf_johanna-klughammer',
                permanent: false,
            },
        ];
    },
});
