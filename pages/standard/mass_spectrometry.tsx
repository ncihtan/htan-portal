import { GetStaticProps } from 'next';
import React from 'react';
import {
    getAllAttributes,
    getDataSchema,
    SchemaDataId,
} from '@htan/data-portal-schema';
import DataStandard, { DataStandardProps } from '../../components/DataStandard';

const MassSpectrometry: React.FunctionComponent<DataStandardProps> = (
    props
) => {
    return (
        <DataStandard {...props}>
            <div className="standards-content">
                <h1>HTAN Mass Spectrometry</h1>
                <p></p>
            </div>
        </DataStandard>
    );
};

export const getStaticProps: GetStaticProps = async (context) => {
    const { dataSchemaData, schemaDataById } = await getDataSchema([
        SchemaDataId.MassSpectrometryLevel1,
        SchemaDataId.MassSpectrometryLevel2,
        SchemaDataId.MassSpectrometryLevel3,
        SchemaDataId.MassSpectrometryLevel4,
        SchemaDataId.MassSpectrometryAuxiliaryFile,
    ]);

    const allAttributes = getAllAttributes(dataSchemaData, schemaDataById);

    return { props: { dataSchemaData, schemaDataById, allAttributes } };
};

export default MassSpectrometry;
