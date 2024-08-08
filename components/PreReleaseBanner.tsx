import Alert from 'react-bootstrap/Alert';
import Link from 'next/link';

const PreReleaseBanner = () => (
    <Alert style={{ marginBottom: 0 }} variant={'success'}>
        The <Link href="/data-updates">V6 data release</Link> is now finalized.
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
