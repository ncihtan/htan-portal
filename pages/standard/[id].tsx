// import React from 'react';
// import { GetServerSideProps } from 'next';
// import {
//     getDataSchema,
//     SchemaDataId,
//     DataSchemaData,
// } from '@htan/data-portal-schema';
// import { HtanNavbar } from '../../components/HtanNavbar';
// import Container from 'react-bootstrap/Container';
// import Row from 'react-bootstrap/Row';
// import Col from 'react-bootstrap/Col';
// import Link from 'next/link';
// import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
// import { faArrowLeft } from '@fortawesome/free-solid-svg-icons/faArrowLeft';
// import DataSchema from '../../components/DataSchema';
// import Footer from '../../components/Footer';

// interface ManifestProps {
//     schemaData: DataSchemaData;
//     requiredDependencies: DataSchemaData[];
//     schemaDataById: { [id: string]: DataSchemaData };
// }

// const Manifest: React.FC<ManifestProps> = ({
//     schemaData,
//     requiredDependencies,
//     schemaDataById,
// }) => {
//     return (
//         <>
//             <HtanNavbar />
//             <Container>
//                 <Row style={{ marginBottom: 10 }}>
//                     <Col>
//                         <Link href="/standards">
//                             <a>
//                                 <FontAwesomeIcon icon={faArrowLeft} />
//                                 &nbsp; Back to Data Standards
//                             </a>
//                         </Link>
//                     </Col>
//                 </Row>
//                 <Row>
//                     <Col>
//                         <h1>{schemaData.attribute} Manifest</h1>
//                     </Col>
//                 </Row>
//                 <Row>
//                     <Col>
//                         <DataSchema
//                             schemaData={requiredDependencies}
//                             dataSchemaMap={schemaDataById}
//                         />
//                     </Col>
//                 </Row>
//             </Container>
//             <Footer />
//         </>
//     );
// };

// export const getServerSideProps: GetServerSideProps = async (context) => {
//     const { id } = context.params as { id: string };
//     const fullId = `bts:${id}` as SchemaDataId;
//     const { schemaDataById } = await getDataSchema([fullId]);
//     const schemaData = schemaDataById[fullId];

//     const requiredDependencies = (schemaData.requiredDependencies || []).map(
//         (depId: string | { '@id': string }) => {
//             const depSchemaId =
//                 typeof depId === 'string' ? depId : depId['@id'];
//             return schemaDataById[depSchemaId];
//         }
//     );

//     return { props: { schemaData, requiredDependencies, schemaDataById } };
// };

// export default Manifest;

import React from 'react';
import { GetServerSideProps } from 'next';
import {
    getDataSchema,
    SchemaDataId,
    DataSchemaData,
} from '@htan/data-portal-schema';
import { HtanNavbar } from '../../components/HtanNavbar';
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Link from 'next/link';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft } from '@fortawesome/free-solid-svg-icons/faArrowLeft';
import DataSchema from '../../components/DataSchema';
import Footer from '../../components/Footer';

interface ManifestProps {
    schemaData: DataSchemaData;
    requiredDependencies: DataSchemaData[];
    schemaDataById: { [id: string]: DataSchemaData };
    referer: string;
}

const Manifest: React.FC<ManifestProps> = ({
    schemaData,
    requiredDependencies,
    schemaDataById,
    referer,
}) => {
    return (
        <>
            <HtanNavbar />
            <Container>
                <Row style={{ marginBottom: 10 }}>
                    <Col>
                        <Link href={referer || '/standards'}>
                            <a>
                                <FontAwesomeIcon icon={faArrowLeft} />
                                &nbsp; Back
                            </a>
                        </Link>
                    </Col>
                </Row>
                <Row>
                    <Col>
                        <h1>{schemaData.attribute} Manifest</h1>
                    </Col>
                </Row>
                <Row>
                    <Col>
                        <DataSchema
                            schemaData={requiredDependencies}
                            dataSchemaMap={schemaDataById}
                        />
                    </Col>
                </Row>
            </Container>
            <Footer />
        </>
    );
};

export const getServerSideProps: GetServerSideProps = async (context) => {
    const { id, referer } = context.query as { id: string; referer?: string };
    const fullId = `bts:${id}` as SchemaDataId;
    const { schemaDataById } = await getDataSchema([fullId]);
    const schemaData = schemaDataById[fullId];

    const requiredDependencies = (schemaData.requiredDependencies || []).map(
        (depId: string | { '@id': string }) => {
            const depSchemaId =
                typeof depId === 'string' ? depId : depId['@id'];
            return schemaDataById[depSchemaId];
        }
    );

    return {
        props: {
            schemaData,
            requiredDependencies,
            schemaDataById,
            referer: referer || null,
        },
    };
};

export default Manifest;
