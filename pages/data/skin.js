import React from "react";
import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/Row";
import HTANNavbar from "../htanNavbar";
import Base from "./skin";

function Skin() {
  return (
      <React.Fragment>
        <HTANNavbar/>
        <Base referrer="Skin" />
      </React.Fragment>
  )
}

export default Skin
