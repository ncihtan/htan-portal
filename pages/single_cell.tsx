import React from 'react';

import {
    DataReleasePage,
    DataReleaseProps,
} from '../components/DataReleasePage';
import { getAtlasList, getStaticContent } from '../ApiUtil';
import { GetStaticProps } from 'next';
import HtanNavbar from '../components/HtanNavbar';
import Footer from '../components/Footer';
import PageWrapper from '../components/PageWrapper';

export const getStaticProps: GetStaticProps = async (context) => {
    const data = await getStaticContent(['summary-blurb-data-release']);
    const atlases = await getAtlasList();

    return {
        props: {
            atlasData: atlases,
            data,
        },
    };
};

function SingleCell(props: DataReleaseProps) {
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
