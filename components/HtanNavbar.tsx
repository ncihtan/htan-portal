import Navbar from 'react-bootstrap/Navbar';
import Nav from 'react-bootstrap/Nav';
import React, { useState } from 'react';
import { NavDropdown } from 'react-bootstrap';

function togglePreview(on: any) {
    if (process.browser) {
        if (window.localStorage.preview) {
            fetch('/api/clearPreview').then(() => {
                window.localStorage.removeItem('preview');
                window.location.reload();
            });
        } else {
            fetch('/api/preview').then(() => {
                window.localStorage.preview = true;
                window.location.reload();
            });
        }
    }
}
const NavSection: React.FunctionComponent<{
    text: string;
    landingPage?: string;
}> = ({ text, children }) => {
    const [open, setOpen] = useState(false);

    return (
        <NavDropdown
            title={text}
            id="basic-nav-dropdown"
            show={open}
            onMouseEnter={() => {
                setOpen(true);
            }}
            onMouseLeave={() => {
                setOpen(false);
            }}
        >
            {children}
        </NavDropdown>
    );
};

export const HtanNavbar: React.FunctionComponent<{}> = () => {
    const navItems: any[] = [
        <Nav.Link href="/explore">Explore</Nav.Link>,

        <NavSection text={'About'}>
            <NavDropdown.Item href="/htan-dcc">
                Data Coordinating Center
            </NavDropdown.Item>
            <NavDropdown.Item href="/research-network">
                Research Network
            </NavDropdown.Item>
            <NavDropdown.Item href="/consortium">
                HTAN Consortium
            </NavDropdown.Item>
            <NavDropdown.Item href="/standards">
                Data Standards
            </NavDropdown.Item>
            <NavDropdown.Item href="/transfer">Data Transfer</NavDropdown.Item>
        </NavSection>,

        <Nav.Link href="/tools">Analysis Tools</Nav.Link>,

        <NavSection text={'Resources'}>
            <NavDropdown.Item href="/resources">Resources</NavDropdown.Item>
            <NavDropdown.Item href="/publications">
                Publications
            </NavDropdown.Item>
            <NavDropdown.Item href="/authors">Authors</NavDropdown.Item>
        </NavSection>,
    ];

    return (
        <Navbar bg="light" expand="lg" className={'main-nav'}>
            <Navbar.Brand href="/">
                <img
                    src="/Updated-HTAN-Text-Logo.png"
                    className={'htanlogo'}
                    alt="HTAN Data Portal"
                />
            </Navbar.Brand>
            <Navbar.Toggle aria-controls="basic-navbar-nav" />
            <Navbar.Collapse id="basic-navbar-nav">
                <Nav className="mr-auto">{navItems}</Nav>
            </Navbar.Collapse>
        </Navbar>
    );
};

export default HtanNavbar;
