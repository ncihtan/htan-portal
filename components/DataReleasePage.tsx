import React from "react";
import Row from "react-bootstrap/Row";
import Container from "react-bootstrap/Container";
import Table from "react-bootstrap/Table";
import Link from "next/link";
import Breadcrumb from "react-bootstrap/Breadcrumb";
import _ from 'lodash'

import HtanNavbar from "./HtanNavbar";
import {getContent} from "../ApiUtil";


/**
 * Strip HTML characters and get content from CMS
 */
function cleanContent(data: CmsData[], slug: string): string {
    let content: string | undefined;

    const filteredData = _.filter(data, d => d.slug === slug);

    if (filteredData[0]) {
        const rendered = filteredData[0].content.rendered;

        if (!_.isEmpty(rendered)) {
            content = rendered.toString();
        }
    }

    return content ? content.replace(/<[^>]*>/g, '') : "";
}

export interface CmsData {
    slug: string;
    content: {
        rendered: string;
        protected: boolean;
    };
    title: {
        rendered: string;
    }
}

export interface DataReleaseProps {
    data: CmsData[];
}

const DataReleasePage = (props: DataReleaseProps) => {
    let summaryContent = getContent("data-release", "summary-blurb");

    return (
        <>
            <HtanNavbar/>
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
                    <span dangerouslySetInnerHTML={{__html: summaryContent}} />
                </Row>

                <Row className="mt-3">
                    <Table>
                        <thead>
                        <tr>
                            <th>Atlas Name</th>
                            <th>Atlas Type</th>
                            <th>Lead Institution(s)</th>
                            <th>Data Release</th>
                        </tr>
                        </thead>
                        <tbody>
                        <tr>
                            <td>
                                {cleanContent(props.data, 'hta1-short-blurb')}
                            </td>
                            <td></td>
                            <td></td>
                            <td>
                                <Link href="/data/hta1">
                                    <a>Data Release</a>
                                </Link>
                            </td>
                        </tr>
                        <tr>
                            <td>
                                {cleanContent(props.data, 'hta2-short-blurb')}
                            </td>
                            <td></td>
                            <td></td>
                            <td>
                                <Link href="/data/hta2">
                                    <a>Data Release</a>
                                </Link>
                            </td>
                        </tr>
                        <tr>
                            <td>
                                {cleanContent(props.data, 'hta3-short-blurb')}
                            </td>
                            <td></td>
                            <td></td>
                            <td>
                                <Link href="/data/hta3">
                                    <a>Data Release</a>
                                </Link>
                            </td>
                        </tr>
                        <tr>
                            <td>
                                {cleanContent(props.data, 'hta4-short-blurb')}
                            </td>
                            <td></td>
                            <td></td>
                            <td>
                                <Link href="/data/hta4">
                                    <a>Data Release</a>
                                </Link>
                            </td>
                        </tr>
                        <tr>
                            <td>
                                {cleanContent(props.data, 'hta5-short-blurb')}
                            </td>
                            <td></td>
                            <td></td>
                            <td>
                                <Link href="/data/hta5">
                                    <a>Data Release</a>
                                </Link>
                            </td>
                        </tr>
                        <tr>
                            <td>
                                {cleanContent(props.data, 'hta6-short-blurb')}
                            </td>
                            <td></td>
                            <td></td>
                            <td>
                                <Link href="/data/hta6">
                                    <a>Data Release</a>
                                </Link>
                            </td>
                        </tr>
                        <tr>
                            <td>
                                {cleanContent(props.data, 'hta7-short-blurb')}
                            </td>
                            <td></td>
                            <td></td>
                            <td>
                                <Link href="/data/hta7">
                                    <a>Data Release</a>
                                </Link>
                            </td>
                        </tr>
                        <tr>
                            <td>
                                {cleanContent(props.data, 'hta8-short-blurb')}
                            </td>
                            <td></td>
                            <td></td>
                            <td>
                                <Link href="/data/hta8">
                                    <a>Data Release</a>
                                </Link>
                            </td>
                        </tr>
                        <tr>
                            <td>
                                {cleanContent(props.data, 'hta9-short-blurb')}
                            </td>
                            <td></td>
                            <td></td>
                            <td>
                                <Link href="/data/hta9">
                                    <a>Data Release</a>
                                </Link>
                            </td>
                        </tr>
                        <tr>
                            <td>
                                {cleanContent(props.data, 'hta10-short-blurb')}
                            </td>
                            <td></td>
                            <td></td>
                            <td>
                                <Link href="/data/hta10">
                                    <a>Data Release</a>
                                </Link>
                            </td>
                        </tr>
                        <tr>
                            <td>
                                {cleanContent(props.data, 'hta11-short-blurb')}
                            </td>
                            <td></td>
                            <td></td>
                            <td>
                                <Link href="/data/hta11">
                                    <a>Data Release</a>
                                </Link>
                            </td>
                        </tr>
                        <tr>
                            <td>
                                {cleanContent(props.data, 'hta12-short-blurb')}
                            </td>
                            <td></td>
                            <td></td>
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
        </>
    );
}

export default DataReleasePage;
