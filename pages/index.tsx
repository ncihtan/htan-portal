import fetch from 'node-fetch';
import React, { useEffect, useState } from 'react';
import { ScaleLoader } from 'react-spinners';

import PreReleaseBanner from '../components/PreReleaseBanner';
import HomePage, { IHomePropsProps } from '../components/HomePage';
import PageWrapper from '../components/PageWrapper';

import { commonStyles } from '@htan/data-portal-commons';

const Home = () => {
    const [data, setData] = useState<IHomePropsProps | undefined>(undefined);

    useEffect(() => {
        const fetchData = async () => {
            const result = await fetch(`/api/data/dashboard`);
            const text = await result.text();
            setData(JSON.parse(text));
        };

        fetchData();
    });

    return (
        <>
            <PreReleaseBanner />
            <PageWrapper>
                {data ? (
                    <HomePage {...data} />
                ) : (
                    <div className={commonStyles.loadingIndicator}>
                        <ScaleLoader />
                    </div>
                )}
            </PageWrapper>
        </>
    );
};

export default Home;
