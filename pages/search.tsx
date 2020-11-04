import fetch from 'node-fetch';
import React from "react";

import {DataReleasePage, DataReleaseProps} from "../components/DataReleasePage";

function DataRelease(props: DataReleaseProps) {
    return <DataReleasePage {...props} />;
};

export default DataRelease;

