import fetch from 'node-fetch';
import React from 'react';

import {
    DataReleasePage,
    DataReleaseProps,
} from '../components/DataReleasePage';
import { getAtlasList, WORDPRESS_BASE_URL } from '../ApiUtil';
import { GetStaticProps } from 'next';
import HtanNavbar from '../components/HtanNavbar';
import Footer from '../components/Footer';

export const getStaticProps: GetStaticProps = async (context) => {
    let slugs = ['summary-blurb-data-release'];
    let overviewURL = `${WORDPRESS_BASE_URL}${JSON.stringify(slugs)}`;
    let res = await fetch(overviewURL);
    let data = await res.json();

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
            <HtanNavbar />
            <div className={'single_cell-iframe-wrapper'}>
                <iframe
                    className={'single-cell-iframe'}
                    src={
                        'https://nsclc-vdj-ucsc-cellbrowser.surge.sh/?ds=nsclc_vdj'
                    }
                ></iframe>
            </div>
        </>
    );
}

export default SingleCell;
