import Navbar from 'react-bootstrap/Navbar';
import Nav from 'react-bootstrap/Nav';
import React, { useState } from 'react';
import { Dropdown, NavDropdown } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faExternalLinkAlt } from '@fortawesome/free-solid-svg-icons';

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
        <Nav.Link href="/tools">Analysis Tools</Nav.Link>,

        <Nav.Link href="https://docs.humantumoratlas.org/" target="_blank">
            Manual{' '}
            <FontAwesomeIcon
                icon={faExternalLinkAlt}
                style={{ height: 16, width: 16 }}
            />
        </Nav.Link>,

        <NavSection text={'About the Data'}>
            <NavDropdown.Item href="/standards">
                Data Standards
            </NavDropdown.Item>
            <NavDropdown.Item href="/data-access">Data Access</NavDropdown.Item>
            <Dropdown.Divider />
            <Nav.Link
                href="https://www.protocols.io/workspaces/ncihtan"
                target="_blank"
            >
                Protocols.io
            </Nav.Link>
        </NavSection>,

        <NavSection text={'About HTAN'}>
            <NavDropdown.Item href="/overview">Overview</NavDropdown.Item>
            <NavDropdown.Item href="/center/htan-dcc">
                Data Coordinating Center
            </NavDropdown.Item>
            <NavDropdown.Item href="/research-network">
                Research Network
            </NavDropdown.Item>
            {/*<NavDropdown.Item href="/consortium">
                Consortium
            </NavDropdown.Item>*/}
            <NavDropdown.Item href="/resources">Resources</NavDropdown.Item>
            <NavDropdown.Item href="/publications">
                Publications
            </NavDropdown.Item>
            {/*<NavDropdown.Item href="/authors">Authors</NavDropdown.Item>*/}
        </NavSection>,

        <NavSection text={'Submit Data'}>
            <NavDropdown.Item href="/transfer">Data Transfer</NavDropdown.Item>
        </NavSection>,

        <NavSection text={'Support'}>
            <Nav.Link
                href="https://sagebionetworks.jira.com/servicedesk/customer/portal/1"
                target="_blank"
            >
                HTAN Help Desk
            </Nav.Link>
        </NavSection>,

        <NavSection text={'News'}>
            <NavDropdown.Item href="/data-updates">
                Data Updates
            </NavDropdown.Item>
            <NavDropdown.Item href="/events">Events</NavDropdown.Item>
            <Dropdown.Divider />
            <Nav.Link
                href="https://groups.google.com/g/htan-news"
                target="_blank"
            >
                Newsletter
            </Nav.Link>
            <Nav.Link href="https://twitter.com/ncihtan" target="_blank">
                Twitter
            </Nav.Link>
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
                <a
                    href="https://docs.humantumoratlas.org/data_access/citing_htan/"
                    target="_blank"
                >
                    Please cite HTAN{' '}
                    <FontAwesomeIcon icon={faExternalLinkAlt} />
                </a>
            </Navbar.Collapse>
        </Navbar>
    );
};

export default HtanNavbar;
