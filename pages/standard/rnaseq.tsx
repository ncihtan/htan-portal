import React from 'react';
import { GetStaticProps } from 'next';

import DataStandard, { DataStandardProps } from '../../components/DataStandard';
import { getStaticContent } from '../../ApiUtil';
import { getDataSchema } from '../../lib/dataSchemaHelpers';

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
    const { dataSchemaData, schemaDataMap } = await getDataSchema([
        'bts:ScRNA-seqLevel1',
        'bts:ScRNA-seqLevel2',
        'bts:ScRNA-seqLevel3',
        'bts:ScRNA-seqLevel4',
    ]);

    return { props: { data, dataSchemaData, schemaDataMap } };
};

export default RnaSeq;
