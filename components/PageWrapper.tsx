import * as React from 'react';
import Footer from './Footer';
import HtanNavbar from './HtanNavbar';

// See the stackoverflow answer at https://stackoverflow.com/a/59429852
// The following import prevents a Font Awesome icon server-side rendering bug,
// where the icons flash from a very large icon down to a properly sized one:
import '@fortawesome/fontawesome-svg-core/styles.css';
// Prevent fontawesome from adding its CSS since we did it manually above:
import { config } from '@fortawesome/fontawesome-svg-core';
config.autoAddCss = false;

export interface IPageWrapperProps {}

const PageWrapper: React.FunctionComponent<IPageWrapperProps> = ({
    children,
}) => {
    return (
        <>
            <div id={'pageWrapper'}>
                <HtanNavbar />
                {children}
            </div>
            <Footer />
        </>
    );
};

export default PageWrapper;
