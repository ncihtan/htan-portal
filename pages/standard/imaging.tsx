import React from 'react';
import { GetStaticProps } from 'next';

import DataStandard, { DataStandardProps } from '../../components/DataStandard';
import { getStaticContent } from '../../ApiUtil';
import { getDataSchema, SchemaDataId } from '../../lib/dataSchemaHelpers';

const Imaging: React.FunctionComponent<DataStandardProps> = (props) => {
    return <DataStandard {...props} title="Imaging" />;
};

export const getStaticProps: GetStaticProps = async (context) => {
    const data = await getStaticContent(['data-standards-imaging-blurb']);
    const { dataSchemaData, schemaDataById } = await getDataSchema([
        SchemaDataId.Imaging,
        SchemaDataId.ImagingLevel2,
    ]);

    return { props: { data, dataSchemaData, schemaDataById } };
};

export default Imaging;
