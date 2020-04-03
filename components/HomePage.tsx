import React from "react";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import ButtonToolbar from "react-bootstrap/ButtonToolbar";
import Button from "react-bootstrap/Button";
import Card from "react-bootstrap/Card";
import CardGroup from "react-bootstrap/CardGroup";
import Container from "react-bootstrap/Container";
import Jumbotron from "react-bootstrap/Jumbotron";

export interface IHomePropsProps {
    hero_blurb: string;
    cards: any[];
}

const HomePage: React.FunctionComponent<IHomePropsProps> = ({ hero_blurb, cards}) => {

    return (<>
        <Jumbotron className={"text-center"}>
            <Row className="justify-content-md-center">
                <h1>Human Tumor Atlas Network Data Portal</h1>
            </Row>

            <Row className="justify-content-md-center mt-5">
                <Col md={{span: 7}}>
                    <span dangerouslySetInnerHTML={{ __html: hero_blurb }}></span>
                </Col>
            </Row>

            <Row className="justify-content-md-center mt-3">
                <ButtonToolbar>
                    <Button href="/data_releases" variant="primary" className="mr-4">
                        Explore the Data
                    </Button>
                </ButtonToolbar>
            </Row>
        </Jumbotron>
    <Container>
        <Row className="justify-content-md-center mt-5">
            <Col md={{span: 8}}>
                <CardGroup>
                    <Card>
                        <Card.Body>
                            <div className={"card-text"}>
                                <span className="card-custom-style" dangerouslySetInnerHTML={{ __html: cards[0] }}></span>
                            </div>
                        </Card.Body>
                    </Card>
                    <Card>
                        <Card.Body>
                            <div className={"card-text"}>
                                <span className="card-custom-style" dangerouslySetInnerHTML={{ __html: cards[1] }}></span>
                            </div>
                        </Card.Body>
                    </Card>
                    <Card>
                        <Card.Body>
                            <div className={"card-text"}>
                                <span className="card-custom-style" dangerouslySetInnerHTML={{ __html: cards[2] }}></span>
                            </div>
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
                            <div className={"card-text"}>
                                <span className="card-custom-style" dangerouslySetInnerHTML={{ __html: cards[3] }}></span>
                            </div>
                        </Card.Body>
                    </Card>
                    <Card>
                        <Card.Body>
                            <div className={"card-text"}>
                                <span className="card-custom-style" dangerouslySetInnerHTML={{ __html: cards[4] }}></span>
                            </div>
                        </Card.Body>
                    </Card>
                    <Card>
                        <Card.Body>
                            <div className={"card-text"}>
                                <span className="card-custom-style" dangerouslySetInnerHTML={{ __html: cards[5] }}></span>
                            </div>
                        </Card.Body>
                    </Card>
                </CardGroup>
            </Col>
        </Row>
    </Container>
    </>);
}


export default HomePage;

