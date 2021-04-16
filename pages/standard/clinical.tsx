import React from 'react';
import { GetStaticProps } from 'next';

import DataStandard, { DataStandardProps } from '../../components/DataStandard';
import { getStaticContent } from '../../ApiUtil';
import { getDataSchema, SchemaDataId } from '../../lib/dataSchemaHelpers';

const Cds: React.FunctionComponent<DataStandardProps> = (props) => {
    return <DataStandard {...props} title="Clinical Data" />;
};

export const getStaticProps: GetStaticProps = async (context) => {
    const data = await getStaticContent(['data-standards-cds-blurb']);

    // TODO this may not be the complete list of clinical data
    const { dataSchemaData, schemaDataById } = await getDataSchema([
        SchemaDataId.Demographics,
        SchemaDataId.Diagnosis,
        SchemaDataId.Exposure,
        SchemaDataId.FamilyHistory,
        SchemaDataId.FollowUp,
        SchemaDataId.MolecularTest,
        SchemaDataId.Therapy,
        SchemaDataId.ClinicalDataTier2,
        SchemaDataId.AcuteLymphoblasticLeukemiaTier3,
        SchemaDataId.BrainCancerTier3,
        SchemaDataId.BreastCancerTier3,
        SchemaDataId.ColorectalCancerTier3,
        SchemaDataId.LungCancerTier3,
        SchemaDataId.MelanomaTier3,
        SchemaDataId.OvarianCancerTier3,
        SchemaDataId.PancreaticCancerTier3,
        SchemaDataId.ProstateCancerTier3,
        SchemaDataId.SarcomaTier3,
    ]);

    return { props: { data, dataSchemaData, schemaDataById } };
};

export default Cds;
