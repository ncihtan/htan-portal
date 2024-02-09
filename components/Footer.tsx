import React from 'react';
import Row from 'react-bootstrap/Row';

const Footer = () => (
    <footer className={'pageFooter'}>
        Human Tumor Atlas Network (HTAN) | National Cancer Institute{' '}
        {new Date().getFullYear()} |{' '}
        <a
            href="https://sagebionetworks.jira.com/servicedesk/customer/portal/1"
            target="_blank"
        >
            HTAN Help Desk
        </a>
    </footer>
);

export default Footer;
