import React from 'react';
import Row from 'react-bootstrap/Row';

const Footer = () => (
    <footer className={'pageFooter'}>
        Human Tumor Atlas Network (HTAN) | National Cancer Institute{' '}
        {new Date().getFullYear()} |{' '}
        <a href="mailto:htan@googlegroups.com">htan@googlegroups.com</a>
        <ul className="nav d-flex justify-content-center">
            <li className="nav-item">
                <a
                    target={'_blank'}
                    className="nav-link"
                    href="https://www.cancer.gov/research/key-initiatives/moonshot-cancer-initiative/implementation/human-tumor-atlas"
                >
                    NCI
                </a>
            </li>
            <li className="nav-item">
                <a
                    className="nav-link"
                    target={'_blank'}
                    href="https://twitter.com/ncihtan"
                >
                    TWITTER
                </a>
            </li>
            <li className="nav-item">
                <a
                    className="nav-link"
                    target={'_blank'}
                    href="https://www.protocols.io/groups/ncihtan"
                >
                    PROTOCOLS.IO
                </a>
            </li>
            <li className="nav-item">
                <a
                    className="nav-link"
                    target={'_blank'}
                    href="https://www.synapse.org/HTAN"
                >
                    SYNAPSE
                </a>
            </li>
        </ul>
    </footer>
);

export default Footer;
