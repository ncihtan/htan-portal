import React from 'react';
import { GetStaticProps } from 'next';

import DataStandard, { DataStandardProps } from '../../components/DataStandard';
import { getStaticContent } from '../../ApiUtil';
import { getDataSchema } from '../../lib/dataSchemaHelpers';

const Imaging: React.FunctionComponent<DataStandardProps> = (props) => {
    return <DataStandard {...props} title="Imaging" />;
};

export const getStaticProps: GetStaticProps = async (context) => {
    const data = await getStaticContent(['data-standards-imaging-blurb']);
    const { dataSchemaData, schemaDataMap } = await getDataSchema([
        'bts:Imaging',
        'bts:ImagingLevel2',
    ]);

    return { props: { data, dataSchemaData, schemaDataMap } };
};

export default Imaging;
