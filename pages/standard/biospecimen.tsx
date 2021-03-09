import React from 'react';
import { GetStaticProps } from 'next';

import DataStandard, { DataStandardProps } from '../../components/DataStandard';
import { getStaticContent } from '../../ApiUtil';
import { getDataSchema } from '../../lib/dataSchemaHelpers';

const Biospecimen: React.FunctionComponent<DataStandardProps> = (props) => {
    return <DataStandard {...props} title="Biospecimen" />;
};

export const getStaticProps: GetStaticProps = async (context) => {
    const data = await getStaticContent(['data-standards-biospecimen-blurb']);
    const { dataSchemaData, schemaDataMap } = await getDataSchema([
        'bts:Biospecimen',
    ]);

    return { props: { data, dataSchemaData, schemaDataMap } };
};

export default Biospecimen;
