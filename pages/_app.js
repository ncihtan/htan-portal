import { useRouter } from 'next/router';
import { useEffect } from 'react';
import 'rc-tooltip/assets/bootstrap.css';
import '../styles/app.scss';
import * as gtag from '../lib/gtag';

function App({ Component, pageProps }) {
    const router = useRouter();
    useEffect(() => {
        const handleRouteChange = (url) => {
            gtag.pageview(url);
        };
        router.events.on('routeChangeComplete', handleRouteChange);
        return () => {
            router.events.off('routeChangeComplete', handleRouteChange);
        };
    }, [router.events]);

    return <Component {...pageProps} />;
}

export default App;
