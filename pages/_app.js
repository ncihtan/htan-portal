import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { ScaleLoader } from 'react-spinners';
import 'rc-tooltip/assets/bootstrap.css';
import '../styles/app.scss';
import * as gtag from '../lib/gtag';

function App({ Component, pageProps }) {
    const router = useRouter();
    const [pageLoading, setPageLoading] = useState(false);

    useEffect(() => {
        const handleRouteChange = (url) => {
            gtag.pageview(url);
        };
        const handleRouteChangeStart = () => setPageLoading(true);
        const handleRouteChangeEnd = () => setPageLoading(false);

        router.events.on('routeChangeComplete', handleRouteChange);
        router.events.on('routeChangeStart', handleRouteChangeStart);
        router.events.on('routeChangeComplete', handleRouteChangeEnd);
        router.events.on('routeChangeError', handleRouteChangeEnd);
        return () => {
            router.events.off('routeChangeComplete', handleRouteChange);
            router.events.off('routeChangeStart', handleRouteChangeStart);
            router.events.off('routeChangeComplete', handleRouteChangeEnd);
            router.events.off('routeChangeError', handleRouteChangeEnd);
        };
    }, [router.events]);

    return (
        <>
            {pageLoading && (
                <div className="pageLoadingIndicator">
                    <ScaleLoader />
                </div>
            )}
            <Component {...pageProps} />
        </>
    );
}

export default App;
