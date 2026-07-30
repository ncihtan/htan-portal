import Alert from 'react-bootstrap/Alert';
import Link from 'next/link';

const PreReleaseBanner = () => (
    <Alert style={{ marginBottom: 0 }} variant={'success'}>
        <a href="/data-updates">
            First data release of HTAN Phase 2 now available!
        </a>
    </Alert>
);

export default PreReleaseBanner;
