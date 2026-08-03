'use client';
import dynamic from 'next/dynamic';

const Explore2ClientComponent = dynamic(
    () => import('../components/Explore2').then((mod) => mod.Explore2),
    {
        ssr: false,
    }
);

export default Explore2ClientComponent;
