import React from 'react';
import Row from 'react-bootstrap/Row';

const Footer = () => (
    <footer className={'pageFooter'}>
        Human Tumor Atlas Network (HTAN) | National Cancer Institute{' '}
        {new Date().getFullYear()} |{' '}
        <a href="mailto:htan@googlegroups.com">htan@googlegroups.com</a>
    </footer>
);

export default Footer;
