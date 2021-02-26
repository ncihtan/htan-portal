import React from 'react';
import DataSchema from "../../components/DataSchema";
import HtanNavbar from '../../components/HtanNavbar';
import Footer from '../../components/Footer';
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Breadcrumb from 'react-bootstrap/Breadcrumb';
import { GetServerSideProps, GetStaticProps } from 'next';
import { CmsData } from '../../types';
import { getStaticContent } from '../../ApiUtil';
import { DataSchemaData, getDataSchema } from "../../lib/dataSchemaHelpers";

export interface RnaseqProps {
    data: CmsData[];
    dataSchemaData: DataSchemaData[];
    schemaDataMap: {[id: string]: DataSchemaData}
}

const Rnaseq: React.FunctionComponent<RnaseqProps> = props => {
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
                        <Breadcrumb.Item active>
                            Single Cell and Single Nucleus RNA Seq
                        </Breadcrumb.Item>
                    </Breadcrumb>
                </Row>
                <Row>
                    <span
                        dangerouslySetInnerHTML={{
                            __html: props.data[0].content.rendered,
                        }}
                    ></span>
                </Row>
                <Row>
                    <DataSchema
                        schemaData={props.dataSchemaData}
                        dataSchemaMap={props.schemaDataMap}
                    />
                </Row>
            </Container>
            <Footer />
        </>
    );
}

export const getStaticProps: GetStaticProps = async (context) => {
    const data = await getStaticContent(['data-standards-rnaseq-blurb']);
    const { dataSchemaData, schemaDataMap } = await getDataSchema(
        ["bts:ScRNA-seqLevel1", "bts:ScRNA-seqLevel2", "bts:ScRNA-seqLevel3", "bts:ScRNA-seqLevel4"]
    );

    return {props: { data, dataSchemaData, schemaDataMap } };
};

export default Rnaseq;
