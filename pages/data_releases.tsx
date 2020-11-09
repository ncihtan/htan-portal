import fetch from "node-fetch";
import React from "react";

import {
  DataReleasePage,
  DataReleaseProps,
} from "../components/DataReleasePage";
import { getAtlasList, WORDPRESS_BASE_URL } from "../ApiUtil";
import { GetStaticProps } from "next";

export const getStaticProps: GetStaticProps = async (context) => {
  let slugs = ["summary-blurb-data-release"];
  let overviewURL = `${WORDPRESS_BASE_URL}${JSON.stringify(slugs)}`;
  let res = await fetch(overviewURL);
  let data = await res.json();

  const atlases = await getAtlasList();

  return {
    props: {
      atlasData: atlases,
      data,
    },
  };
};

function DataRelease(props: DataReleaseProps) {
  return <DataReleasePage {...props} />;
}

export default DataRelease;
