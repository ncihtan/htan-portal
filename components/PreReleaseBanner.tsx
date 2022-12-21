import Alert from 'react-bootstrap/Alert';

const PreReleaseBanner = () => (
    <Alert style={{ marginBottom: 0 }} variant={'warning'}>
        The <a href='/data-updates'>V3 data release</a> is now
        finalized. Most of the data shown are{' '} <a
        href="/data-download">downloadable</a>. Please send any questions or
        feedback to{' '}
        <a href="mailto:htan@googlegroups.com">htan@googlegroups.com</a>
    </Alert>
);

export default PreReleaseBanner;
