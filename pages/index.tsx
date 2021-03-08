import React from 'react';

import HtanNavbar from '../components/HtanNavbar';
import HomePage, { IHomePropsProps } from '../components/HomePage';
import Footer from '../components/Footer';
import { GetStaticProps } from 'next';
import { WPConstants } from '../types';
import { getAtlasList, getContent, getStaticContent } from '../ApiUtil';

const Home = (data: IHomePropsProps) => {
    return (
        <>
            <HtanNavbar />
            <HomePage {...data} />
            <Footer />
        </>
    );
};




export const getStaticProps: GetStaticProps = async (context) => {
    const data = await getStaticContent([WPConstants.HOMEPAGE_HERO_BLURB]);

    const homepageContent = data.find(
        (d: any) => d.slug === WPConstants.HOMEPAGE_HERO_BLURB
    );

    const atlases = await getAtlasList();

    const cards = await Promise.all([
        getContent('card-1', 'homepage'),
        getContent('card-2', 'homepage'),
        getContent('card-3', 'homepage'),
        getContent('card-4', 'homepage'),
        getContent('card-5', 'homepage'),
        getContent('card-6', 'homepage'),
    ]);

    return {
        props: { hero_blurb: homepageContent.content.rendered, cards: cards, atlases },
    };
};

export default Home;
