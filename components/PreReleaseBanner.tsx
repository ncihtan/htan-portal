import Alert from 'react-bootstrap/Alert';
import Link from 'next/link';

const PreReleaseBanner = () => (
    <Alert style={{ marginBottom: 0 }} variant={'success'}>
        <a href="https://www.nature.com/collections/fihchcjehc" target="_blank">
            Read the new collection of HTAN publications
        </a>
        !
    </Alert>
);

export default PreReleaseBanner;
