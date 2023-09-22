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
          // fix case sensitivity for HTA/hta
          // see https://github.com/vercel/next.js/issues/21498
          // We can remove this when we upgrade next
          ...Array.from({length:20}, (_, i) => {
            return {
              source:`/HTA${i}`,
              destination: `/hta${i}`,
              permanent: true,
            }
          })
        ]
    }
});
