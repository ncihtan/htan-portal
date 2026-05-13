import { useRouter } from 'next/router';
import { useEffect } from 'react';
import 'rc-tooltip/assets/bootstrap.css';
import '../styles/app.scss';
import * as gtag from '../lib/gtag';
import { ChatProvider } from '../components/chat/ChatContext';
import ChatPanel from '../components/chat/ChatPanel';

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

    // ChatProvider and ChatPanel live at the _app level so the open/close
    // state survives route changes (e.g. when the "Apply to Explore" button
    // calls router.push and the page tree unmounts).
    return (
        <ChatProvider>
            <Component {...pageProps} />
            <ChatPanel />
        </ChatProvider>
    );
}

export default App;
