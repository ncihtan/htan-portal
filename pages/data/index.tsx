import fetch from 'node-fetch';
import React from "react";

import DataReleasePage, {DataReleaseProps} from "../../components/DataReleasePage";
import {WORDPRESS_BASE_URL} from "../../ApiUtil";

export async function getServerSideProps(): Promise<{props: DataReleaseProps}> {

    // TODO we should have better variable names here
    let slugs1 = [
        "hta12-short-blurb",
        "hta11-short-blurb",
        "hta10-short-blurb",
        "hta9-short-blurb",
        "hta8-short-blurb",
        "hta7-short-blurb"
    ]
    let slugs2 = [
        "hta6-short-blurb",
        "hta5-short-blurb",
        "hta4-short-blurb",
        "hta3-short-blurb",
        "hta2-short-blurb",
        "hta1-short-blurb"
    ]
    const url = `${WORDPRESS_BASE_URL}${JSON.stringify(slugs1)}`;
    const url2 = `${WORDPRESS_BASE_URL}${JSON.stringify(slugs2)}`;
    const res = await fetch(url);
    const res2 = await fetch(url2);
    let data = await res.json();
    let data2 = await res2.json();
    data = data.concat(data2);

    return {
        props: {
            data,
        },
    }
}

const DataRelease = (props: DataReleaseProps) => <DataReleasePage {...props} />;

export default DataRelease;
