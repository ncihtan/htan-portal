import React from 'react';
import Row from 'react-bootstrap/Row';

const Footer = () => (
    <footer className={'pageFooter'}>
        Gray Foundation{' '}
        {new Date().getFullYear()}
    </footer>
);

export default Footer;
