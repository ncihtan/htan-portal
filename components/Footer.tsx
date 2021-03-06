import React from 'react';
import Row from 'react-bootstrap/Row';

const Footer = () => (
    <footer className={'pageFooter'}>
        Human Tumor Atlas Network (HTAN) @ National Cancer Institute{' '}
        {new Date().getFullYear()}
    </footer>
);

export default Footer;
