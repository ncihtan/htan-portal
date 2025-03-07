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

const SpatialTranscriptomics: React.FunctionComponent<DataStandardProps> = (
    props
) => {
    return (
        <DataStandard {...props}>
            <div className="standards-content">
                <h1>HTAN Electron Microscopy</h1>
                <p>
                    Electron microscopy data are divided into four primary
                    levels:
                </p>
                <table className="table table-data-levels">
                    <thead>
                        <tr>
                            <th>Level</th>
                            <th>Definition</th>
                            <th>Example Data</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>1</td>
                            <td>
                                Raw electron microscopy data as one TIFF file
                                per plane for a 3D image stack or per tile for a
                                2D large area montage
                            </td>
                            <td>tiff</td>
                        </tr>
                        <tr>
                            <td>2</td>
                            <td>
                                Processed electron microscopy data as one
                                OME-TIFF image per plane or montage
                            </td>
                            <td>ome-tiff</td>
                        </tr>
                        <tr>
                            <td>3</td>
                            <td>Segmented electron microscopy data</td>
                            <td>am, tiff</td>
                        </tr>
                        <tr>
                            <td>4</td>
                            <td>
                                Movies or other derived files from electron
                                microscopy data
                            </td>
                            <td>mp4, csv</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </DataStandard>
    );
};

export const getServerSideProps: GetServerSideProps = async (context) => {
    const { dataSchemaData, schemaDataById } = await getDataSchema([
        SchemaDataId.ElectronMicroscopyLevel1,
        SchemaDataId.ElectronMicroscopyLevel2,
        SchemaDataId.ElectronMicroscopyLevel3,
        SchemaDataId.ElectronMicroscopyLevel4,
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

export default SpatialTranscriptomics;
