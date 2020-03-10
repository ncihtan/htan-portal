import React from "react";
import HTANNavbar from "./htanNavbar";
import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/Row";

function Standards() {
  return (
      <React.Fragment>
        <HTANNavbar/>
          <Container>
              <Row className="mt-3">
                  <h1>Data Standards</h1>
              </Row>
              <Row className="mt-3">
                  <p>
                      Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut
                      labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris
                      nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit
                      esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt
                      in culpa qui officia deserunt mollit anim id est laborum.
                  </p>
              </Row>
              <Row className="mt-3">
                  <h4>
                      Browse HTAN Data Standards
                  </h4>
              </Row>
          </Container>
      </React.Fragment>
  )
}

export default Standards
