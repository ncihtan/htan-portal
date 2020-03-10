import Navbar from "react-bootstrap/Navbar";
import Nav from "react-bootstrap/Nav";
import React from "react";

const HTANNavbar = () => (
  <Navbar bg="light" expand="lg">
  <Navbar.Brand href="/">HTAN Data Portal</Navbar.Brand>
  <Navbar.Toggle aria-controls="basic-navbar-nav" />
  <Navbar.Collapse id="basic-navbar-nav">
    <Nav className="mr-auto">
      <Nav.Link href="/data">Data Release</Nav.Link>
      <Nav.Link href="/standards">Data Standards</Nav.Link>
      <Nav.Link href="/transfer">Data Transfer</Nav.Link>
    </Nav>
  </Navbar.Collapse>
</Navbar>
)

export default HTANNavbar
