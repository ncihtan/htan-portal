import React from 'react';
import { GetStaticProps } from 'next';

import DataStandard, { DataStandardProps } from '../../components/DataStandard';
import { getStaticContent } from '../../ApiUtil';
import { getDataSchema } from '../../lib/dataSchemaHelpers';

const BulkRNASeq: React.FunctionComponent<DataStandardProps> = (props) => {
    return <DataStandard {...props} title="Bulk RNA Seq" />;
};

export const getStaticProps: GetStaticProps = async (context) => {
    const data = await getStaticContent(['data-standards-bulk-rnaseq-blurb']);
    const { dataSchemaData, schemaDataMap } = await getDataSchema([
        'bts:BulkRNA-seqLevel1',
        'bts:BulkRNA-seqLevel2',
        'bts:BulkRNA-seqLevel3',
    ]);

    return { props: { data, dataSchemaData, schemaDataMap } };
};

export default BulkRNASeq;
