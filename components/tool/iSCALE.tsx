import React from 'react';

const ISCALE: React.FunctionComponent = () => {
    return (
        <div>
            <h3>iSCALE</h3>
            <p>
                <a href="https://github.com/amesch441/iSCALE">iSCALE</a>{' '}
                (Inferring Spatially resolved Cellular Architectures for
                Large-sized tissue Environments) is a novel framework designed
                to integrate multiple daughter captures and utilize H&E
                information from large tissue samples, enabling the prediction
                of gene expression in large-sized tissues with near single-cell
                resolution. This implementation is published at:{' '}
                <a href="https://pubmed.ncbi.nlm.nih.gov/40954300/">
                    PMID: 40954300
                </a>
            </p>
            <p>
                <a href="https://github.com/amesch441/iSCALE">
                    View on GitHub →
                </a>
            </p>
        </div>
    );
};

export default ISCALE;
