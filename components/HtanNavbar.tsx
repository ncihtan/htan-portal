import Navbar from "react-bootstrap/Navbar";
import Nav from "react-bootstrap/Nav";
import React from "react";

function togglePreview(on:any){
    if (process.browser) {
        if (window.localStorage.preview) {
            fetch("/api/clearPreview").then(() => {
                window.localStorage.removeItem("preview");
                window.location.reload();
            });
        } else {
            fetch("/api/preview").then(() => {
                window.localStorage.preview = true;
                window.location.reload();
            });
        }
    }
}

const HtanNavbar = () => (
    <Navbar bg="nav-purple" variant="dark" expand="lg" className={"main-nav"}>
        <Navbar.Brand href="/">
            <img src="/htanLogo.png" height="60" alt="HTAN Data Portal" />
        </Navbar.Brand>
        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        <Navbar.Collapse id="basic-navbar-nav">
            <Nav className="mr-auto">
                <Nav.Link href="/data_releases">Data Release</Nav.Link>
                <Nav.Link href="/standards">Data Standards</Nav.Link>
                <Nav.Link href="/transfer">Data Transfer</Nav.Link>
            </Nav>
        </Navbar.Collapse>
        <Nav>
            <Nav.Link onClick={togglePreview}>
                {
                    process.browser && window.localStorage.preview ? "#Disable Preview#" : "#Enable Preview#"
                }
            </Nav.Link>
            <Nav.Link href="https://humantumoratlas.org/">HTAN Main Site</Nav.Link>
        </Nav>
    </Navbar>
);

export default HtanNavbar;
