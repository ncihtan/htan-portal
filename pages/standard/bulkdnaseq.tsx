import React from 'react';
import { GetStaticProps } from 'next';

import DataStandard, { DataStandardProps } from "../../components/DataStandard";
import { getStaticContent } from '../../ApiUtil';
import { getDataSchema } from "../../lib/dataSchemaHelpers";

const BulkDNASeq: React.FunctionComponent<DataStandardProps> = props => {
    return (
        <DataStandard {...props} title="Bulk DNA Seq" />
    );
}

export const getStaticProps: GetStaticProps = async (context) => {
    const data = await getStaticContent(['data-standards-bulk-dnaseq-blurb']);
    const { dataSchemaData, schemaDataMap } = await getDataSchema(
        ["bts:BulkWESLevel1", "bts:BulkWESLevel2", "bts:BulkWESLevel3"]
    );

    return {props: { data, dataSchemaData, schemaDataMap } };
};

export default BulkDNASeq;
