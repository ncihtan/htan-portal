import fetch from 'node-fetch';
import React from "react";

import DataReleasePage, {DataReleaseProps} from "../../components/DataReleasePage";
import {WORDPRESS_BASE_URL} from "../../ApiUtil";
import {GetServerSideProps} from "next";

export const getServerSideProps: GetServerSideProps = async context => {
    let slugs = ["summary-blurb-data-release"];
    let overviewURL = `${WORDPRESS_BASE_URL}${JSON.stringify(slugs)}`;
    let res = await fetch(overviewURL);
    let data = await res.json();
    return {props: {data}}
}

const DataRelease = (props: DataReleaseProps) => <DataReleasePage {...props} />;

export default DataRelease;
