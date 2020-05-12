import fetch from 'node-fetch';
import React from "react";

import {DataReleasePage, DataReleaseProps} from "../components/DataReleasePage";
import {getAtlasList, WORDPRESS_BASE_URL} from "../ApiUtil";
import { GetStaticProps} from "next";
import HtanNavbar from "../components/HtanNavbar";
import Footer from "../components/Footer";

function ImageViewer({query}:any) {

    const url = decodeURIComponent(query.u);

    return <>
        <HtanNavbar/>
        <div className={"single_cell-iframe-wrapper"}>
            <iframe className={"single-cell-iframe"} src={url}></iframe>
        </div>
    </>;

};

export default ImageViewer;


ImageViewer.getInitialProps = function({query}:any){
    return { query };
};

