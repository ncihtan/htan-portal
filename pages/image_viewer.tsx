import React from 'react';

import PageWrapper from '../components/PageWrapper';

function ImageViewer({ query }: any) {
    const url = decodeURIComponent(query.u).replace(/^http:/, 'https:');

    return (
        <PageWrapper>
            <div className={'single_cell-iframe-wrapper'}>
                <iframe className={'single-cell-iframe'} src={url}></iframe>
            </div>
        </PageWrapper>
    );
}

export default ImageViewer;

ImageViewer.getInitialProps = function ({ query }: any) {
    return { query };
};
