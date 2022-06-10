import Alert from 'react-bootstrap/Alert';

const PreReleaseBanner = () => (
    <Alert style={{ marginBottom: 0 }} variant={'warning'}>
        The HTAN Portal is in the beta release phase. Level 3 and 4 data are{' '}
        <a href='/explore?tab=file&selectedFilters=%5B%7B"value"%3A"Level+3"%2C"label"%3A"Level+3"%2C"group"%3A"Level"%2C"count"%3A559%2C"isSelected"%3Afalse%7D%2C%7B"value"%3A"Level+4"%2C"label"%3A"Level+4"%2C"group"%3A"Level"%2C"count"%3A306%2C"isSelected"%3Afalse%7D%5D'>
            available
        </a>
        . Level 1 and 2 sequencing data can be accessed through{' '}
        <a
            href="https://www.ncbi.nlm.nih.gov/projects/gap/cgi-bin/study.cgi?study_id=phs002371.v1.p1"
            target="_blank"
        >
            dbGaP
        </a>
        . Please send any questions or feedback to{' '}
        <a href="mailto:htan@googlegroups.com">htan@googlegroups.com</a>
    </Alert>
);

export default PreReleaseBanner;
