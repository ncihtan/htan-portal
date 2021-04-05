import React from 'react';
import { GetStaticProps } from 'next';

import DataStandard, { DataStandardProps } from '../../components/DataStandard';
import { getStaticContent } from '../../ApiUtil';
import { getDataSchema, SchemaDataId } from '../../lib/dataSchemaHelpers';

const ScatacSeq: React.FunctionComponent<DataStandardProps> = (props) => {
    return <DataStandard {...props} title="Single Cell ATAC Seq" />;
};

export const getStaticProps: GetStaticProps = async (context) => {
    const data = await getStaticContent(['data-standards-scatacseq-blurb']);
    const { dataSchemaData, schemaDataById } = await getDataSchema([
        SchemaDataId.scATACSeqLevel1,
    ]);

    return { props: { data, dataSchemaData, schemaDataById } };
};

export default ScatacSeq;
