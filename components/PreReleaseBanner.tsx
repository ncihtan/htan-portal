import Alert from 'react-bootstrap/Alert';
import Link from 'next/link';

const PreReleaseBanner = () => (
    <Alert style={{ marginBottom: 0 }} variant={'success'}>
        Join the in-person <Link href="/jamboree">Data Jamboree</Link> Nov 6th -
        8th at the NIH Campus in Bethesda, MD
    </Alert>
);

export default PreReleaseBanner;
