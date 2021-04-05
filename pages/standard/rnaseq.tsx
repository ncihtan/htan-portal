import React from 'react';
import { GetStaticProps } from 'next';

import DataStandard, { DataStandardProps } from '../../components/DataStandard';
import { getStaticContent } from '../../ApiUtil';
import { getDataSchema, SchemaDataId } from '../../lib/dataSchemaHelpers';

const RnaSeq: React.FunctionComponent<DataStandardProps> = (props) => {
    return (
        <DataStandard
            {...props}
            title="Single Cell and Single Nucleus RNA Seq"
        />
    );
};

export const getStaticProps: GetStaticProps = async (context) => {
    const data = await getStaticContent(['data-standards-rnaseq-blurb']);
    const { dataSchemaData, schemaDataById } = await getDataSchema([
        SchemaDataId.scRNASeqLevel1,
        SchemaDataId.scRNASeqLevel2,
        SchemaDataId.scRNASeqLevel3,
        SchemaDataId.scRNASeqLevel4,
    ]);

    return { props: { data, dataSchemaData, schemaDataById } };
};

export default RnaSeq;
