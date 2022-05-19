import { getAllPages, getPageByPageName } from '../lib/pageUtils';
import matter from 'gray-matter';
import React from 'react';
import PageWrapper from '../components/PageWrapper';
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';

import { GetStaticProps } from 'next';

export const getStaticProps: GetStaticProps = async function getStaticProps(
    context
) {
    // @ts-ignore
    const page = getPageByPageName(context.params.page);

    const { data: frontMatter, content } = matter(page);

    return {
        props: {
            html: content,
        },
    };
};

function Page({ html }: any) {
    return (
        <>
            <PageWrapper>
                <Container>
                    <Row className={'contentWrapper'}>
                        <div
                            className={'col'}
                            dangerouslySetInnerHTML={{ __html: html }}
                        ></div>
                    </Row>
                </Container>
            </PageWrapper>
        </>
    );
}

export default Page;

export async function getStaticPaths() {
    const pages = getAllPages();

    const paths = pages.map((p) => {
        debugger;
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
