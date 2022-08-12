import Alert from 'react-bootstrap/Alert';

const PreReleaseBanner = () => (
    <Alert style={{ marginBottom: 0 }} variant={'warning'}>
        The HTAN Portal is in the beta release phase. Most of the data shown are{' '}
        <a href="/data-download">downloadable</a>. Please send any questions or
        feedback to{' '}
        <a href="mailto:htan@googlegroups.com">htan@googlegroups.com</a>
    </Alert>
);

export default PreReleaseBanner;
