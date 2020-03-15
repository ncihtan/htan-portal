import fetch from 'node-fetch';
import React from "react";

import DataReleasePage, {DataReleaseProps} from "../../components/DataReleasePage";

// getStaticProps gets called at build time
// getServerSideProps gets called on every request
export async function getServerSideProps(): Promise<{props: DataReleaseProps}> {
    // Call an external API endpoint to get content
    // TODO we should have better variable names here
    const url = `https://humantumoratlas.org/wp-json/wp/v2/pages/?slug=hta12-short-blurb,hta11-short-blurb,hta10-short-blurb,hta9-short-blurb,hta8-short-blurb,hta7-short-blurb&_fields=content,slug,title&cacheBuster=${new Date().getTime()}`;
    const url2 = `https://humantumoratlas.org/wp-json/wp/v2/pages/?slug=hta6-short-blurb,hta5-short-blurb,hta4-short-blurb,hta3-short-blurb,hta2-short-blurb,hta1-short-blurb&_fields=content,slug,title&cacheBuster=${new Date().getTime()}`;
    const res = await fetch(url);
    const res2 = await fetch(url2);
    let data = await res.json();
    let data2 = await res2.json();
    data = data.concat(data2);

    // By returning { props: data }, the component
    // will receive `data` as a prop at build time
    return {
        props: {
            data,
        },
    }
}

const DataRelease = (props: DataReleaseProps) => <DataReleasePage {...props} />;

export default DataRelease;