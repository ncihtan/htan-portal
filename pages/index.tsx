import React from "react";

import HtanNavbar from "../components/HtanNavbar";
import HomePage from "../components/HomePage";
import Footer from "../components/Footer";
import {GetServerSideProps} from "next";
import fetch from "node-fetch";
import {CmsData} from "../types";

export interface HomeProps {
    data: CmsData[];
}

const Home = (data: HomeProps) => {
    return (
        <>
            <HtanNavbar/>
            <HomePage data={data}/>
            <Footer/>
        </>
    );
}

export const getServerSideProps: GetServerSideProps = async context => {
    let slugs = ["homepage-hero-blurb"];
    let overviewURL = `https://humantumoratlas.org/wp-json/wp/v2/pages/?slug=${JSON.stringify(slugs)}&_fields=content,slug,title`;
    let res = await fetch(overviewURL);
    let data = await res.json();
    return {props: {data}}
}

export default Home;
