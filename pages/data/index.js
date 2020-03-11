import React from "react";
import HTANNavbar from "../../components/htanNavbar";
import Row from "react-bootstrap/Row";
import Container from "react-bootstrap/Container";
import Table from "react-bootstrap/Table";
import Link from "next/link";
import Breadcrumb from "react-bootstrap/Breadcrumb";

function DataRelease() {
    return (
        <React.Fragment>
            <HTANNavbar/>
            <Container>
                <Row>
                    <Breadcrumb className="mt-3">
                        <Breadcrumb.Item href="/">Home</Breadcrumb.Item>
                        <Breadcrumb.Item active>
                            Data Release
                        </Breadcrumb.Item>
                    </Breadcrumb>
                </Row>

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
                                HTAPP Pilot Project: Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod
                                tempor incididunt ut labore et dolore magna aliqua.
                            </td>
                            <td>
                                <Link href="/data/hta1">
                                    <a>Data Release</a>
                                </Link>
                            </td>
                        </tr>
                        <tr>
                            <td>
                                PCAPP Pilot Project: Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod
                                tempor incididunt ut labore et dolore magna aliqua.
                            </td>
                            <td>
                                <Link href="/data/hta2">
                                    <a>Data Release</a>
                                </Link>
                            </td>
                        </tr>
                        <tr>
                            <td>
                                Boston University: Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod
                                tempor incididunt ut labore et dolore magna aliqua.
                            </td>
                            <td>
                                <Link href="/data/hta3">
                                    <a>Data Release</a>
                                </Link>
                            </td>
                        </tr>
                        <tr>
                            <td>
                                CHOP: Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod
                                tempor incididunt ut labore et dolore magna aliqua.
                            </td>
                            <td>
                                <Link href="/data/hta4">
                                    <a>Data Release</a>
                                </Link>
                            </td>
                        </tr>
                        <tr>
                            <td>
                                Lung Atlas: Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod
                                tempor incididunt ut labore et dolore magna aliqua.
                            </td>
                            <td>
                                <Link href="/data/hta5">
                                    <a>Data Release</a>
                                </Link>
                            </td>
                        </tr>
                        <tr>
                            <td>
                                Pancreas Atlas: Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod
                                tempor incididunt ut labore et dolore magna aliqua.
                            </td>
                            <td>
                                <Link href="/data/hta6">
                                    <a>Data Release</a>
                                </Link>
                            </td>
                        </tr>
                        <tr>
                            <td>
                                Prostate Atlas: Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod
                                tempor incididunt ut labore et dolore magna aliqua.
                            </td>
                            <td>
                                <Link href="/data/hta7">
                                    <a>Data Release</a>
                                </Link>
                            </td>
                        </tr>
                        <tr>
                            <td>
                                Skin Atlas: Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod
                                tempor incididunt ut labore et dolore magna aliqua.
                            </td>
                            <td>
                                <Link href="/data/hta8">
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
                                <Link href="/data/hta9">
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
                                <Link href="/data/hta10">
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
                                <Link href="/data/hta11">
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
                                <Link href="/data/hta12">
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
