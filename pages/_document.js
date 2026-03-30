import Document, { Html, Head, Main, NextScript } from 'next/document';

import { GA_TRACKING_ID } from '../lib/gtag';

export default class MyDocument extends Document {
    render() {
        return (
            <Html>
                <Head>
                    {/* Global Site Tag (gtag.js) - Google Analytics */}
                    <script
                        async
                        src={`https://www.googletagmanager.com/gtag/js?id=${GA_TRACKING_ID}`}
                    />
                    <script
                        dangerouslySetInnerHTML={{
                            __html: `
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());

            gtag('config', '${GA_TRACKING_ID}', {
              page_path: window.location.pathname,
            });
          `,
                        }}
                    />
                    <link rel="shortcut icon" href="/favicon.ico"></link>
                    <title>NCI Human Tumor Atlas Network</title>
                </Head>
                <body>
                    <Main />
                    <NextScript />
                    {/* HTAN Help Desk Widget - Jira Service Management */}
                    <script
                        data-jsd-embedded
                        data-key="659c52c2-51d3-414d-ab38-5a8414b062ce"
                        data-base-url="https://jsd-widget.atlassian.com/"
                        src="https://jsd-widget.atlassian.com/assets/embed.js"
                    />
                </body>
            </Html>
        );
    }
}
