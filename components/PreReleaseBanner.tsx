import Alert from 'react-bootstrap/Alert';
import Link from 'next/link';

const PreReleaseBanner = () => (
    <Alert style={{ marginBottom: 0 }} variant={'info'}>
        Open access (Level 3 and 4) files are currently unavailable through Synapse.
        Please visit the{' '}
        <a
            href="https://sagebionetworks.jira.com/servicedesk/customer/portal/1"
            target="_blank"
        >
            HTAN Help Desk
        </a>{' '}
        for questions and feedback.
    </Alert>
);

export default PreReleaseBanner;
