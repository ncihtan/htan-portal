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

function dashboardIcon(text:string, description:string) {
    return (
        <Col key={`icon-${description}`} xs lg="2" >
            <div style={{textAlign:"center"}}>
                <div style={{color:"white",fontSize:"60px", lineHeight:"70px"}}>
                    {text}
                </div>
                <div style={{color:"white",fontSize:"20px"}}>
                    {description}
                </div>
            </div>
        </Col>
    );
}


const HomePage: React.FunctionComponent<IHomePropsProps> = ({ hero_blurb, cards}) => {

    const dashboardData = [
        {text: "12", description: "Atlases"},
        {text: "11", description: "Organs"},
        {text: ">1K", description: "Participants"},
        {text: ">10K", description: "Biospecimens"},
    ];

    return (<>
        <Jumbotron className={"text-center"} style={{borderRadius:"0px",marginBottom:"0px",backgroundColor:"#161920"/*"#191919"*/}}>
            <Row className="justify-content-md-center mt-5">
                <Col style={{backgroundColor:"#161920", padding:20, borderRadius:10,opacity:0.9}} md={{span: 5}}>
                    <h1 style={{color:"#efeae7",opacity:1.0}}>Human Tumor Atlas Network Data Portal</h1>
                    <br />
                    <span style={{color:"#8e8e8e",opacity:1.0}} dangerouslySetInnerHTML={{ __html: hero_blurb }}></span>
                    <div style={{display:"flex",justifyContent:"center"}}>
                        <ButtonToolbar>
                            <Button href="/data_releases" variant="primary" className="mr-4">
                                Explore the Data
                            </Button>
                        </ButtonToolbar>
                    </div>
                </Col>
            </Row>

            <Row className="justify-content-md-center mt-3">
            </Row>
        </Jumbotron>
    <Container fluid style={{backgroundColor:"#6B618B",paddingTop:"30px",paddingBottom:"30px"}}>
        <Row className="justify-content-md-center" >
            {dashboardData.map((icon) => dashboardIcon(icon.text, icon.description))}
        </Row>
    </Container>
    <Container>
        <Row className="justify-content-md-center mt-5">
            <img src="/htanDatasetsWithTitle.svg" />
        </Row>
    </Container>
    {/* Hide cards for now
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
    </Container> */}
    </>);
}


export default HomePage;

