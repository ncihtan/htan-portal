import React from "react";

import HtanNavbar from "../components/HtanNavbar";
import HomePage from "../components/HomePage";
import Footer from "../components/Footer";
import {GetServerSideProps} from "next";
import fetch from "node-fetch";

const Home = (data: any) => {
    return (
        <>
            <HtanNavbar/>
            <HomePage data={data}/>
            <Footer/>
        </>
    );
}

export const getServerSideProps: GetServerSideProps = async context => {
    let slugs = [
        "homepage-card-1",
        "homepage-card-2",
        "homepage-card-3",
        "homepage-card-4",
        "homepage-card-5",
        "homepage-card-6",
        "homepage-hero-blurb"
    ];

    let overviewURL = `https://humantumoratlas.org/wp-json/wp/v2/pages/?slug=${JSON.stringify(slugs)}&_fields=content,slug,title`;
    let res = await fetch(overviewURL);
    let data = await res.json();
    return {props: {data: data}}
}

export default Home;
