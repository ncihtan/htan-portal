import React from "react";
import HTANNavbar from "../../components/htanNavbar";
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
