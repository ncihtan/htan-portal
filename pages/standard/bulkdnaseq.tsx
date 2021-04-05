import React from 'react';
import { GetStaticProps } from 'next';

import DataStandard, { DataStandardProps } from '../../components/DataStandard';
import { getStaticContent } from '../../ApiUtil';
import { getDataSchema, SchemaDataId } from '../../lib/dataSchemaHelpers';

const BulkDNASeq: React.FunctionComponent<DataStandardProps> = (props) => {
    return <DataStandard {...props} title="Bulk DNA Seq" />;
};

export const getStaticProps: GetStaticProps = async (context) => {
    const data = await getStaticContent(['data-standards-bulk-dnaseq-blurb']);
    const { dataSchemaData, schemaDataById } = await getDataSchema([
        SchemaDataId.BulkWESLevel1,
        SchemaDataId.BulkWESLevel2,
        SchemaDataId.BulkWESLevel3,
    ]);

    return { props: { data, dataSchemaData, schemaDataById } };
};

export default BulkDNASeq;
