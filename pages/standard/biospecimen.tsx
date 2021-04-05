import React from 'react';
import { GetStaticProps } from 'next';

import DataStandard, { DataStandardProps } from '../../components/DataStandard';
import { getStaticContent } from '../../ApiUtil';
import { getDataSchema, SchemaDataId } from '../../lib/dataSchemaHelpers';

const Biospecimen: React.FunctionComponent<DataStandardProps> = (props) => {
    return <DataStandard {...props} title="Biospecimen" />;
};

export const getStaticProps: GetStaticProps = async (context) => {
    const data = await getStaticContent(['data-standards-biospecimen-blurb']);
    const { dataSchemaData, schemaDataById } = await getDataSchema([
        SchemaDataId.Biospecimen,
    ]);

    return { props: { data, dataSchemaData, schemaDataById } };
};

export default Biospecimen;
