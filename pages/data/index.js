import React from "react";
import HTANNavbar from "../htanNavbar";
import Row from "react-bootstrap/Row";
import Container from "react-bootstrap/Container";
import Table from "react-bootstrap/Table";
import Link from "next/link";

function DataRelease() {
    return (
        <React.Fragment>
        <HTANNavbar/>
            <Container>
                <Row className="mt-3">
                    <h1>Data Release</h1>
                </Row>
                <Row className="mt-3">
                    <p>
                        Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut
                        labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco
                        laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in
                        voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat
                        non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.
                    </p>
                </Row>
                <Row className="mt-3">
                    <Table>
                        <thead>
                        <tr>
                            <th>Atlas</th>
                            <th>Data Release</th>
                        </tr>
                        </thead>
                        <tbody>
                        <tr>
                            <td>
                                Blood Atlas: Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod
                                tempor
                                incididunt ut labore et dolore magna aliqua.
                            </td>
                            <td>
                                <Link href="/data/blood">
                                    <a>Data Release</a>
                                </Link>
                            </td>
                        </tr>
                        <tr>
                            <td>
                                Breast Atlas: Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod
                                tempor
                                incididunt ut labore et dolore magna aliqua.
                            </td>
                            <td>
                                <Link href="/data/breast">
                                    <a>Data Release</a>
                                </Link>
                            </td>
                        </tr>
                        <tr>
                            <td>
                                Colon Atlas: Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod
                                tempor
                                incididunt ut labore et dolore magna aliqua.
                            </td>
                            <td>
                                <Link href="/data/colon">
                                    <a>Data Release</a>
                                </Link>
                            </td>
                        </tr>
                        <tr>
                            <td>
                                CNS Atlas: Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod
                                tempor
                                incididunt ut labore et dolore magna aliqua.
                            </td>
                            <td>
                                <Link href="/data/cns">
                                    <a>Data Release</a>
                                </Link>
                            </td>
                        </tr>
                        <tr>
                            <td>
                                Lung Atlas: Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod
                                tempor
                                incididunt ut labore et dolore magna aliqua.
                            </td>
                            <td>
                                <Link href="/data/lung">
                                    <a>Data Release</a>
                                </Link>
                            </td>
                        </tr>
                        <tr>
                            <td>
                                Pancreas Atlas: Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod
                                tempor
                                incididunt ut labore et dolore magna aliqua.
                            </td>
                            <td>
                                <Link href="/data/pancreas">
                                    <a>Data Release</a>
                                </Link>
                            </td>
                        </tr>
                        <tr>
                            <td>
                                Prostate Atlas: Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod
                                tempor
                                incididunt ut labore et dolore magna aliqua.
                            </td>
                            <td>
                                <Link href="/data/prostate">
                                    <a>Data Release</a>
                                </Link>
                            </td>
                        </tr>
                        <tr>
                            <td>
                                Skin Atlas: Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod
                                tempor
                                incididunt ut labore et dolore magna aliqua.
                            </td>
                            <td>
                                <Link href="/data/skin">
                                    <a>Data Release</a>
                                </Link>
                            </td>
                        </tr>
                        <tr>
                            <td>
                                SNS Atlas: Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod
                                tempor
                                incididunt ut labore et dolore magna aliqua.
                            </td>
                            <td>
                                <Link href="/data/sns">
                                    <a>Data Release</a>
                                </Link>
                            </td>
                        </tr>
                        </tbody>
                    </Table>
                </Row>
            </Container>
        </React.Fragment>
    )
}

export default DataRelease
