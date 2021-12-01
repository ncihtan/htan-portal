import Alert from 'react-bootstrap/Alert';

const PreReleaseBanner = () => (
    <Alert style={{ marginBottom: 0 }} variant={'warning'}>
        The HTAN Data Portal is in the alpha release phase. Only{' '}
        <a href='/explore?tab=file&selectedFilters=%5B%7B"value"%3A"Level+3"%2C"label"%3A"Level+3"%2C"group"%3A"Level"%2C"count"%3A559%2C"isSelected"%3Afalse%7D%2C%7B"value"%3A"Level+4"%2C"label"%3A"Level+4"%2C"group"%3A"Level"%2C"count"%3A306%2C"isSelected"%3Afalse%7D%5D'>
            level 3 and 4 data
        </a>{' '}
        can be downloaded. Please send any questions or feedback to{' '}
        <a href="mailto:htan@googlegroups.com">htan@googlegroups.com</a>
    </Alert>
);

export default PreReleaseBanner;
