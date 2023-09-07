import React from 'react';

import PageWrapper from '../components/PageWrapper';

function SingleCell() {
    return (
        <>
            <PageWrapper>
                <div className={'single_cell-iframe-wrapper'}>
                    <iframe
                        className={'single-cell-iframe'}
                        src={
                            'https://nsclc-vdj-ucsc-cellbrowser.surge.sh/?ds=nsclc_vdj'
                        }
                    ></iframe>
                </div>
            </PageWrapper>
        </>
    );
}

export default SingleCell;
