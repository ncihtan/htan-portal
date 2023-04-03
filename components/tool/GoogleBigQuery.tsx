import React from 'react';

const GoogleBigQuery: React.FunctionComponent = () => {
    return (
        <div>
            <h3>Google BigQuery</h3>
            <p>
                <a href="https://cloud.google.com/bigquery">Google BigQuery</a>{' '}
                is a massively-parallel analytics engine ideal for working with
                tabular data. HTAN single cell and metadata BigQuery tables are
                available via the CRDC ISB Cancer Gateway in the Cloud
            </p>
            <p>
                <a href="https://isb-cgc.appspot.com">
                    <img
                        width="800"
                        src="https://user-images.githubusercontent.com/2837859/179309894-52004856-b61a-44ad-ac68-66539902b779.png"
                    />
                </a>
            </p>
            <p>
                <a href="https://isb-cgc.appspot.com">
                    Explore HTAN BigQuery tables in ISB-CGC
                </a>
                . Included are computational notebooks illustrating how to query
                and work with HTAN data. To explore HTAN BigQuery tables in
                ISB-CGC, select
                <b>Launch</b> under BigQuery Table Search and <b>HTAN</b> from
                the Program dropdown. To access HTAN R and Python notebooks,
                select <b>GitHub</b> under Notebooks and navigate to the{' '}
                <b>HTAN</b> folder.
            </p>
        </div>
    );
};

export default GoogleBigQuery;
