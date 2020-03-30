import React from "react";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import ButtonToolbar from "react-bootstrap/ButtonToolbar";
import Button from "react-bootstrap/Button";
import Card from "react-bootstrap/Card";
import CardGroup from "react-bootstrap/CardGroup";
import Container from "react-bootstrap/Container";
import Jumbotron from "react-bootstrap/Jumbotron";
import {getContent} from "../ApiUtil";
import _ from "lodash";
import {CmsData} from "../types";

export interface HomeProps {
    data: CmsData[];
}

const HomePage = (data: {data: HomeProps}) => {
    let props = data.data.data

    let homepageCard1 = getContent("card-1", "homepage");
    let homepageCard2 = getContent("card-2", "homepage");
    let homepageCard3 = getContent("card-3", "homepage");
    let homepageCard4 = getContent("card-4", "homepage");
    let homepageCard5 = getContent("card-5", "homepage");
    let homepageCard6 = getContent("card-6", "homepage");

    let heroBlurb = _.filter(props, (o: any) => o.slug === `homepage-hero-blurb`);

    return (
    <Container>
        <Jumbotron className="mt-5">
            <Row className="justify-content-md-center">
                <h1>Human Tumor Atlas Network Data Portal</h1>
            </Row>

            <Row className="justify-content-md-center mt-5">
                <Col md={{span: 7}}>
                    <span dangerouslySetInnerHTML={{ __html: heroBlurb[0].content.rendered}}></span>
                </Col>
            </Row>

            <Row className="justify-content-md-center mt-3">
                <ButtonToolbar>
                    <Button href="/data" variant="primary" className="mr-4">
                        Explore the Data
                    </Button>
                </ButtonToolbar>
            </Row>
        </Jumbotron>

        <Row className="justify-content-md-center mt-5">
            <Col md={{span: 8}}>
                <CardGroup>
                    <Card>
                        <Card.Body>
                            <Card.Text>
                                <span className="card-custom-style" dangerouslySetInnerHTML={{ __html: homepageCard1}}></span>
                            </Card.Text>
                        </Card.Body>
                    </Card>
                    <Card>
                        <Card.Body>
                            <Card.Text>
                                <span className="card-custom-style" dangerouslySetInnerHTML={{ __html: homepageCard2}}></span>
                            </Card.Text>
                        </Card.Body>
                    </Card>
                    <Card>
                        <Card.Body>
                            <Card.Text>
                                <span className="card-custom-style" dangerouslySetInnerHTML={{ __html: homepageCard3}}></span>
                            </Card.Text>
                        </Card.Body>
                    </Card>
                </CardGroup>
            </Col>
        </Row>

        <Row className="justify-content-md-center mt-5">
            <Col md={{span: 8}}>
                <CardGroup>
                    <Card>
                        <Card.Body>
                            <Card.Text>
                                <span className="card-custom-style" dangerouslySetInnerHTML={{ __html: homepageCard4}}></span>
                            </Card.Text>
                        </Card.Body>
                    </Card>
                    <Card>
                        <Card.Body>
                            <Card.Text>
                                <span className="card-custom-style" dangerouslySetInnerHTML={{ __html: homepageCard5}}></span>
                            </Card.Text>
                        </Card.Body>
                    </Card>
                    <Card>
                        <Card.Body>
                            <Card.Text>
                                <span className="card-custom-style" dangerouslySetInnerHTML={{ __html: homepageCard6}}></span>
                            </Card.Text>
                        </Card.Body>
                    </Card>
                </CardGroup>
            </Col>
        </Row>
    </Container>
    );
}


export default HomePage;

