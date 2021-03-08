import React from 'react';
import { GetStaticProps } from 'next';

import DataStandard, { DataStandardProps } from "../../components/DataStandard";
import { getStaticContent } from '../../ApiUtil';
import { getDataSchema } from "../../lib/dataSchemaHelpers";

const Cds: React.FunctionComponent<DataStandardProps> = props => {
    return (
        <DataStandard {...props} title="Clinical Data" />
    );
}

export const getStaticProps: GetStaticProps = async (context) => {
    const data = await getStaticContent(['data-standards-cds-blurb']);

    // TODO this may not be the complete list of clinical data
    const { dataSchemaData, schemaDataMap } = await getDataSchema([
        "bts:Demographics",
        "bts:Diagnosis",
        "bts:Exposure",
        "bts:FamilyHistory",
        "bts:FollowUp",
        "bts:MolecularTest",
        "bts:Treatment",
        "bts:ClinicalDataTier2"
    ]);

    return {props: { data, dataSchemaData, schemaDataMap } };
};

export default Cds;
