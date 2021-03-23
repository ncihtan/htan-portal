import * as React from 'react';
import HtanNavbar from './HtanNavbar';
import Footer from './Footer';

const PageWrapper = (props: any) => {
    return (
        <div id={'pageWrapper'}>
            <HtanNavbar />
            {props.children}
            <Footer />
        </div>
    );
};

export default PageWrapper;
