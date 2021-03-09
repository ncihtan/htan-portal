import React from 'react';
import Breadcrumb from 'react-bootstrap/Breadcrumb';
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';

import { DataSchemaData } from '../lib/dataSchemaHelpers';
import { CmsData } from '../types';
import DataSchema from './DataSchema';
import Footer from './Footer';
import HtanNavbar from './HtanNavbar';

export interface DataStandardProps {
    title: string;
    data: CmsData[];
    dataSchemaData?: DataSchemaData[];
    schemaDataMap?: { [id: string]: DataSchemaData };
}

const DataStandard: React.FunctionComponent<DataStandardProps> = (props) => {
    return (
        <>
            <HtanNavbar />
            <Container>
                <Row>
                    <Breadcrumb className="mt-3">
                        <Breadcrumb.Item href="/">Home</Breadcrumb.Item>
                        <Breadcrumb.Item href="/standards">
                            Data Standards
                        </Breadcrumb.Item>
                        <Breadcrumb.Item active>{props.title}</Breadcrumb.Item>
                    </Breadcrumb>
                </Row>
                <Row>
                    <span
                        dangerouslySetInnerHTML={{
                            __html: props.data[0].content.rendered,
                        }}
                    />
                </Row>
                {props.schemaDataMap && props.dataSchemaData && (
                    <Row>
                        <DataSchema
                            schemaData={props.dataSchemaData}
                            dataSchemaMap={props.schemaDataMap}
                        />
                    </Row>
                )}
            </Container>
            <Footer />
        </>
    );
};

export default DataStandard;
