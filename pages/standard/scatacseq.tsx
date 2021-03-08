import React from 'react';
import { GetStaticProps } from 'next';

import DataStandard, { DataStandardProps } from "../../components/DataStandard";
import { getStaticContent } from '../../ApiUtil';
import { getDataSchema } from "../../lib/dataSchemaHelpers";

const ScatacSeq: React.FunctionComponent<DataStandardProps> = props => {
    return (
        <DataStandard {...props} title="Single Cell ATAC Seq" />
    );
}

export const getStaticProps: GetStaticProps = async (context) => {
    const data = await getStaticContent(['data-standards-scatacseq-blurb']);
    const { dataSchemaData, schemaDataMap } = await getDataSchema(
        ["bts:ScATAC-seqLevel1"]
    );

    return {props: { data, dataSchemaData, schemaDataMap } };
};


export default ScatacSeq;
