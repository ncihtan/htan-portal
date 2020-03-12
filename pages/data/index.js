import React from "react";
import HTANNavbar from "../../components/htanNavbar";
import Row from "react-bootstrap/Row";
import Container from "react-bootstrap/Container";
import Table from "react-bootstrap/Table";
import Link from "next/link";
import Breadcrumb from "react-bootstrap/Breadcrumb";
import fetch from 'node-fetch'
import _ from 'lodash'

/**
 * Strip HTML characters and get content from CMS
 * @param data
 * @param slug
 * @returns {string|*}
 */
const getContent = (data, slug) => {
    let content = _.filter(data, (o) => o.slug === slug);

    if (content[0]) {
        content = content[0].content.rendered;
        if ((content === null) || (content === ''))
            return "";
        else
            content = content.toString();
    }
    return content.replace(/<[^>]*>/g, '');
};

function DataRelease(data) {
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
                        Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod
                        tempor incididunt ut
                        labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud
                        exercitation ullamco
                        laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in
                        reprehenderit in
                        voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint
                        occaecat cupidatat
                        non proident, sunt in culpa qui officia deserunt mollit anim id est
                        laborum.
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
                                {getContent(data.data, 'hta1-short-blurb')}
                            </td>
                            <td>
                                <Link href="/data/hta1">
                                    <a>Data Release</a>
                                </Link>
                            </td>
                        </tr>
                        <tr>
                            <td>
                                {getContent(data.data, 'hta2-short-blurb')}
                            </td>
                            <td>
                                <Link href="/data/hta2">
                                    <a>Data Release</a>
                                </Link>
                            </td>
                        </tr>
                        <tr>
                            <td>
                                {getContent(data.data, 'hta3-short-blurb')}
                            </td>
                            <td>
                                <Link href="/data/hta3">
                                    <a>Data Release</a>
                                </Link>
                            </td>
                        </tr>
                        <tr>
                            <td>
                                {getContent(data.data, 'hta4-short-blurb')}
                            </td>
                            <td>
                                <Link href="/data/hta4">
                                    <a>Data Release</a>
                                </Link>
                            </td>
                        </tr>
                        <tr>
                            <td>
                                {getContent(data.data, 'hta5-short-blurb')}
                            </td>
                            <td>
                                <Link href="/data/hta5">
                                    <a>Data Release</a>
                                </Link>
                            </td>
                        </tr>
                        <tr>
                            <td>
                                {getContent(data.data, 'hta6-short-blurb')}
                            </td>
                            <td>
                                <Link href="/data/hta6">
                                    <a>Data Release</a>
                                </Link>
                            </td>
                        </tr>
                        <tr>
                            <td>
                                {getContent(data.data, 'hta7-short-blurb')}
                            </td>
                            <td>
                                <Link href="/data/hta7">
                                    <a>Data Release</a>
                                </Link>
                            </td>
                        </tr>
                        <tr>
                            <td>
                                {getContent(data.data, 'hta8-short-blurb')}
                            </td>
                            <td>
                                <Link href="/data/hta8">
                                    <a>Data Release</a>
                                </Link>
                            </td>
                        </tr>
                        <tr>
                            <td>
                                {getContent(data.data, 'hta9-short-blurb')}
                            </td>
                            <td>
                                <Link href="/data/hta9">
                                    <a>Data Release</a>
                                </Link>
                            </td>
                        </tr>
                        <tr>
                            <td>
                                {getContent(data.data, 'hta10-short-blurb')}
                            </td>
                            <td>
                                <Link href="/data/hta10">
                                    <a>Data Release</a>
                                </Link>
                            </td>
                        </tr>
                        <tr>
                            <td>
                                {getContent(data.data, 'hta11-short-blurb')}
                            </td>
                            <td>
                                <Link href="/data/hta11">
                                    <a>Data Release</a>
                                </Link>
                            </td>
                        </tr>
                        <tr>
                            <td>
                                {getContent(data.data, 'hta12-short-blurb')}
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

// getStaticProps gets called at build time
// getServerSideProps gets called on every request
export async function getServerSideProps() {
    // Call an external API endpoint to get content
    const url = `https://humantumoratlas.org/wp-json/wp/v2/pages/?slug=hta12-short-blurb,hta11-short-blurb,hta10-short-blurb,hta9-short-blurb,hta8-short-blurb,hta7-short-blurb&_fields=content,slug,title&cacheBuster=${new Date().getTime()}`;
    const url2 = `https://humantumoratlas.org/wp-json/wp/v2/pages/?slug=hta6-short-blurb,hta5-short-blurb,hta4-short-blurb,hta3-short-blurb,hta2-short-blurb,hta1-short-blurb&_fields=content,slug,title&cacheBuster=${new Date().getTime()}`;
    const res = await fetch(url);
    const res2 = await fetch(url2);
    let data = await res.json();
    let data2 = await res2.json();
    data = data.concat(data2);

    // By returning { props: data }, the component
    // will receive `data` as a prop at build time
    return {
        props: {
            data,
        },
    }
}

export default DataRelease
