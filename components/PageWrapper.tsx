import * as React from 'react';
import Footer from './Footer';
import HtanNavbar, { HtanNavbarNew } from './HtanNavbar';

export interface IPageWrapperProps {}

const PageWrapper: React.FunctionComponent<IPageWrapperProps> = ({
    children,
}) => {
    return (
        <div id={'pageWrapper'}>
            <HtanNavbarNew />
            {children}
            <Footer />
        </div>
    );
};

export default PageWrapper;
