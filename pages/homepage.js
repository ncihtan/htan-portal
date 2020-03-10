import React from "react";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import ButtonToolbar from "react-bootstrap/ButtonToolbar";
import Button from "react-bootstrap/Button";

const Homepage = () => (
    <React.Fragment>
        <Row className="justify-content-md-center mt-5">
            <h1>Human Tumor Atlas Network Data Portal</h1>
        </Row>
        <Row className="justify-content-md-center mt-5">
            <Col md={{span: 4}}>
                <p>
                    Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore
                    et
                    dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut
                    aliquip
                    ex ea commodo consequat.
                </p>
            </Col>
        </Row>
        <Row className="justify-content-md-center">
            <ButtonToolbar>
                <Button href="#" variant="primary" className="mr-4">Explore the Data</Button>
                <Button variant="secondary">Learn More</Button>
            </ButtonToolbar>
        </Row>
    </React.Fragment>
)

export default Homepage

