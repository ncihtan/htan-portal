import Alert from 'react-bootstrap/Alert';
import Link from 'next/link';

const PreReleaseBanner = () => (
    <Alert style={{ marginBottom: 0 }} variant={'success'}>
        New data from BU, and Stanford is available as part of{' '}
        <Link href="/data-updates">Release 5.2</Link>!
    </Alert>
);

export default PreReleaseBanner;
