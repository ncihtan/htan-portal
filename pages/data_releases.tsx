import React from 'react';

import {
    DataReleasePage,
    DataReleaseProps,
} from '../components/DataReleasePage';
import { getAtlasList, getStaticContent } from '../ApiUtil';
import { GetStaticProps } from 'next';
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

function DataRelease(props: DataReleaseProps) {
    return (
        <PageWrapper>
            <DataReleasePage {...props} />
        </PageWrapper>
    );
}

export default DataRelease;
