import React from "react";

import HtanNavbar from "../components/HtanNavbar";
import HomePage, { IHomePropsProps } from "../components/HomePage";
import Footer from "../components/Footer";
import { GetStaticProps } from "next";
import fetch from "node-fetch";
import { WPConstants } from "../types";
import { getContent, WORDPRESS_BASE_URL } from "../ApiUtil";

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
  let slugs = [WPConstants.HOMEPAGE_HERO_BLURB];

  let overviewURL = `${WORDPRESS_BASE_URL}${JSON.stringify(slugs)}`;
  let res = await fetch(overviewURL);
  let data = await res.json();

  const homepageContent = data.find(
    (d: any) => d.slug === WPConstants.HOMEPAGE_HERO_BLURB
  );

  const cards = await Promise.all([
    getContent("card-1", "homepage"),
    getContent("card-2", "homepage"),
    getContent("card-3", "homepage"),
    getContent("card-4", "homepage"),
    getContent("card-5", "homepage"),
    getContent("card-6", "homepage"),
  ]);

  return {
    props: { hero_blurb: homepageContent.content.rendered, cards: cards },
  };
};

export default Home;
