import React from 'react';

const CelloType: React.FunctionComponent = () => {
    return (
        <div>
            <h3>CelloType</h3>
            <p>
                <a href="https://github.com/tanlabcode/CelloType">CelloType</a>{' '}
                is an end-to-end Transformer-based method for automated
                cell/nucleus segmentation and cell type classification. This
                implementation is published at:{' '}
                <a href="https://www.biorxiv.org/content/10.1101/2024.09.15.613139v1.full">
                    https://www.biorxiv.org/content/10.1101/2024.09.15.613139v1.full
                </a>
            </p>
            <p>
                <a href="https://github.com/tanlabcode/CelloType">
                    <img
                        loading="lazy"
                        src="https://github.com/tanlabcode/CelloType/blob/main/figures/codex_example.png?raw=true"
                        alt=""
                        width="800"
                    />
                </a>
            </p>
        </div>
    );
};

export default CelloType;
