import React from 'react';

const CalicoST: React.FunctionComponent = () => {
    return (
        <div>
            <h3>CalicoST</h3>
            <p>
                <a href="https://github.com/raphael-group/CalicoST/">
                    CalicoST
                </a>{' '}
                is inferring allele-specific copy numbers and reconstructing
                spatial tumor evolution by using spatial transcriptomics data.
                This implementation is published at:{' '}
                <a href="https://pubmed.ncbi.nlm.nih.gov/39478176/">
                    https://pubmed.ncbi.nlm.nih.gov/39478176/
                </a>
            </p>
            <p>
                <a href="https://github.com/raphael-group/CalicoST/">
                    <img
                        loading="lazy"
                        src="https://raw.githubusercontent.com/raphael-group/CalicoST/refs/heads/main/docs/_static/img/overview4_combine.png"
                        alt=""
                        width="800"
                    />
                </a>
            </p>
        </div>
    );
};

export default CalicoST;
