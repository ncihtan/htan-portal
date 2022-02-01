import * as React from 'react';
import Footer from './Footer';
import HtanNavbar from './HtanNavbar';

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
