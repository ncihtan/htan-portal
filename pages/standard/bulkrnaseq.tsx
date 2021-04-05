import React from 'react';
import { GetStaticProps } from 'next';

import DataStandard, { DataStandardProps } from '../../components/DataStandard';
import { getStaticContent } from '../../ApiUtil';
import { getDataSchema, SchemaDataId } from '../../lib/dataSchemaHelpers';

const BulkRNASeq: React.FunctionComponent<DataStandardProps> = (props) => {
    return <DataStandard {...props} title="Bulk RNA Seq" />;
};

export const getStaticProps: GetStaticProps = async (context) => {
    const data = await getStaticContent(['data-standards-bulk-rnaseq-blurb']);
    const { dataSchemaData, schemaDataById } = await getDataSchema([
        SchemaDataId.BulkRNASeqLevel1,
        SchemaDataId.BulkRNASeqLevel2,
        SchemaDataId.BulkRNASeqLevel3,
    ]);

    return { props: { data, dataSchemaData, schemaDataById } };
};

export default BulkRNASeq;
