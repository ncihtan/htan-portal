import React from 'react';

const MIMCyCIF: React.FunctionComponent = () => {
    return (
        <div>
            <h3>MIMCyCIF</h3>
            <p>
                <a href="https://github.com/zacsims/IF_panel_reduction">
                    MIMCyCIF
                </a>{' '}
                is a computational panel reduction method for CyCIF, leveraging
                9 markers to impute information from 25, enhancing speed,
                content, and reducing costs. This implementation is published
                at:{' '}
                <a href=" https://www.nature.com/articles/s42003-024-06110-y">
                    https://www.nature.com/articles/s42003-024-06110-y
                </a>
            </p>
            <p>
                <a href="https://github.com/zacsims/IF_panel_reduction">
                    <img
                        loading="lazy"
                        src="https://raw.githubusercontent.com/zacsims/IF_panel_reduction/refs/heads/main/src/mae_arch.png"
                        alt=""
                        width="800"
                    />
                </a>
            </p>
        </div>
    );
};

export default MIMCyCIF;
