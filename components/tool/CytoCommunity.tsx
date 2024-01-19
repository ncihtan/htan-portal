import React from 'react';

const CytoCommunity: React.FunctionComponent = () => {
    return (
        <div>
            <h3>CytoCommunity</h3>
            <p>
                <a href="https://zenodo.org/records/8335454">CytoCommunity</a>{' '}
                is a computational tool for end-to-end unsupervised and
                supervised analyses of single-cell spatial maps and enables
                direct discovery of conditional-specific cell-cell communication
                patterns across variable spatial scales. This implementation is
                published and citable at:{' '}
                <a href="https://doi.org/10.1038/s41592-023-02124-2">
                    https://doi.org/10.1038/s41592-023-02124-2
                </a>
            </p>
            <p>
                <a href="https://zenodo.org/records/8335454">
                    <img
                        loading="lazy"
                        src="https://raw.githubusercontent.com/huBioinfo/CytoCommunity/b8d1ed968162412a77a1cf9883c38cae2262bc23/support/Schematic_Diagram.png"
                        alt=""
                        width="800"
                    />
                </a>
            </p>
        </div>
    );
};

export default CytoCommunity;
