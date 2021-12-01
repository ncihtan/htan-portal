import { getPageByPageName } from '../lib/getPageByName';
import compile from '@mdx-js/mdx';
import matter from 'gray-matter';
import { serialize } from 'next-mdx-remote/serialize';
import { MDXRemote } from 'next-mdx-remote';
import PreReleaseBanner from '../components/PreReleaseBanner';
import React from 'react';
import PageWrapper from '../components/PageWrapper';

export const getStaticProps = async function getStaticProps({ params }) {
    const page = getPageByPageName(params.page);

    const { data: frontMatter, content } = matter(page);

    //const content = await compile(page.content || '');

    const mdxSource = await serialize(content);

    return {
        props: {
            mdxSource,
        },
    };
};

function Page({ mdxSource }) {
    return (
        <>
            <PreReleaseBanner />
            <PageWrapper>
                <MDXRemote {...mdxSource}></MDXRemote>
            </PageWrapper>
        </>
    );
}

export default Page;

export async function getStaticPaths() {
    return {
        paths: [{ params: { page: 'blah' } }],
        fallback: false,
    };
}
