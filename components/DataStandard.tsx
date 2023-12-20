import React from 'react';
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';

import { CmsData } from '../types';
import DataSchema from './DataSchema';
import Footer from './Footer';
import { HtanNavbar } from './HtanNavbar';
import { Col } from 'react-bootstrap';
import Link from 'next/link';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft } from '@fortawesome/free-solid-svg-icons/faArrowLeft';
import { DataSchemaData } from '@htan/data-portal-schema';

export interface DataStandardProps {
    title: string;
    data: CmsData[];
    dataSchemaData?: DataSchemaData[];
    schemaDataById?: { [schemaDataId: string]: DataSchemaData };
}

const DataStandard: React.FunctionComponent<DataStandardProps> = (props) => {
    return (
        <>
            <HtanNavbar />
            <Container>
                <Row style={{ marginBottom: 10 }}>
                    <Col>
                        <FontAwesomeIcon icon={faArrowLeft} />
                        &nbsp;
                        <Link href="/standards">Back to Data Standards</Link>
                    </Col>
                </Row>
                <Row>
                    <Col>{props.children}</Col>
                </Row>
                {props.schemaDataById && props.dataSchemaData && (
                    <Row>
                        <DataSchema
                            schemaData={props.dataSchemaData}
                            dataSchemaMap={props.schemaDataById}
                        />
                    </Row>
                )}
            </Container>
            <Footer />
        </>
    );
};

export default DataStandard;
