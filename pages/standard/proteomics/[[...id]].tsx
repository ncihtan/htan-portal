import { GetServerSideProps } from 'next';
import React from 'react';
import {
    getAllAttributes,
    getDataSchema,
    SchemaDataId,
} from '@htan/data-portal-schema';
import DataStandard, {
    DataStandardProps,
} from '../../../components/DataStandard';
import { getFirstIdFromContext } from '../../../lib/helpers';

const Proteomics: React.FunctionComponent<DataStandardProps> = (props) => {
    return (
        <DataStandard {...props}>
            <div className="standards-content">
                <h1>HTAN Proteomics</h1>
                <p>
                    HTAN supports several proteomics modalities. Modalities
                    supported are growing as new data are generated.
                </p>
            </div>
        </DataStandard>
    );
};

export const getServerSideProps: GetServerSideProps = async (context) => {
    const { dataSchemaData, schemaDataById } = await getDataSchema([
        SchemaDataId.RPPALevel2,
        SchemaDataId.RPPALevel3,
        SchemaDataId.RPPALevel4,
    ]);

    const allAttributes = getAllAttributes(dataSchemaData, schemaDataById);

    return {
        props: {
            dataSchemaData,
            schemaDataById,
            allAttributes,
            manifestId: getFirstIdFromContext(context),
        },
    };
};

export default Proteomics;
