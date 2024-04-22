import Alert from 'react-bootstrap/Alert';
import Link from 'next/link';

const PreReleaseBanner = () => (
    <Alert style={{ marginBottom: 0 }} variant={'warning'}>
        Open access (Level 3 and 4) files are currently unavailable through Synapse.
        The HTAN DCC will be resetting Synapse access controls on HTAN projects on Monday 22 April.
    </Alert>
);

export default PreReleaseBanner;
