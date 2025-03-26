'use client';
import dynamic from 'next/dynamic';

const ClientComponent = dynamic(
    () =>
        import('@htan/data-portal-explore')
            // this part is needed if your use a named export
            // you can replace by ".default" when using a default export
            .then((mod) => mod.Explore),
    {
        // This prevents server-side rendering of BrowserComponent
        ssr: false,
    }
);

export default ClientComponent;
