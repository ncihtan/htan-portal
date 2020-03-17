import React from "react";
import Row from "react-bootstrap/Row";

const Footer = () => (
    <footer>
        <Row className="justify-content-md-center mt-5 mb-5">
            <small>Human Tumor Atlas Network (HTAN) @ National Cancer
                Institute {new Date().getFullYear()}</small>
        </Row>
    </footer>
);

export default Footer;

