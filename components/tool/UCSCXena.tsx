import React from 'react';

const UCSCXena: React.FunctionComponent = () => {
    return (
        <div>
            <h3>UCSCXena</h3>
            <p>
                <a href="https://xena.ucsc.edu/">UCSCXena</a> is an
                interactive viewer for single-cell expression.
            </p>
            <p>
                UCSC Xena is an online exploration tool for multiplexed imaging and multi-omic single-cell data. 
                <a href="https://xena.ucsc.edu/">
                    <img
                        width="600"
                        src="https://github.com/cBioPortal/cbioportal/assets/1334004/0f58a05e-5c4d-42a2-8d0d-61b630dc2e25"
                    />
                </a><br />
                HTAN melanoma sample t-CyCIF image showing three antibody signals. Genomic data is overlaid as circles, coloring cells annotated as keratinocytes in purple. Users can also view an interactive 3D UMAP/tSNE of the same data. To navigate the tool, select spatial or embedding layouts, manipulate image layers, and choose the genomics data to color the cells.
            </p>
        </div>
    );
}
export default UCSCXena;