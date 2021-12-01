import { getAllPages, getPageByPageName } from '../lib/pageUtils';
import matter from 'gray-matter';
import { serialize } from 'next-mdx-remote/serialize';
import { MDXRemote } from 'next-mdx-remote';
import PreReleaseBanner from '../components/PreReleaseBanner';
import React from 'react';
import PageWrapper from '../components/PageWrapper';

export const getStaticProps = async function getStaticProps({ params }) {
    const page = getPageByPageName(params.page);

    const { data: frontMatter, content } = matter(page);

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
    const pages = getAllPages();

    const paths = pages.map((p) => {
        return {
            params: {
                page: p.data.page,
            },
        };
    });

    return {
        paths,
        fallback: false,
    };
}
