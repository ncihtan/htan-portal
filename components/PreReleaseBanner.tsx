import Alert from 'react-bootstrap/Alert';

const PreReleaseBanner = () => (
    <Alert style={{ marginBottom: 0 }} variant={'warning'}>
        The HTAN Data Portal is in a pre-release phase. Data cannot be
        downloaded yet.{' '}
        <a href="https://github.com/ncihtan/htan-portal/issues" target="_blank">
            Feedback
        </a>{' '}
        is welcome!
    </Alert>
);

export default PreReleaseBanner;
