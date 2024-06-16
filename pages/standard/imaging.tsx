import React from 'react';
import { GetStaticProps } from 'next';

import DataStandard, { DataStandardProps } from '../../components/DataStandard';
import { getDataSchema, SchemaDataId } from '@htan/data-portal-schema';

const Imaging: React.FunctionComponent<DataStandardProps> = (props) => {
    return (
        <DataStandard {...props}>
            <div className="standards-content">
                <h1>HTAN Imaging Data</h1>
                <p>
                    The HTAN data model for imaging data is based upon the{' '}
                    <a href="https://www.miti-consortium.org/">
                        Minimum Information about Tissue Imaging (MITI)
                    </a>{' '}
                    reporting guidelines. These comprise minimal metadata for
                    highly multiplexed tissue images and were developed in
                    consultation with methods developers, experts in imaging
                    metadata (e.g., DICOM and OME) and multiple large-scale
                    atlasing projects; they are guided by existing standards and
                    accommodate most multiplexed imaging technologies and both
                    centralized and distributed data storage.
                </p>
                <p>
                    For further information on the MITI guidelines, please see
                    the{' '}
                    <a href="https://www.miti-consortium.org/">MITI website</a>,{' '}
                    <a href="https://github.com/miti-consortium/MITI">
                        specification on Github
                    </a>
                    , and{' '}
                    <a href="https://www.nature.com/articles/s41592-022-01415-4">
                        Nature Methods
                    </a>{' '}
                    publication.
                </p>
                <p>
                    The HTAN data model for imaging was intended primarily for
                    multiplexed imaging, such as CODEX, CyCIF, and IMC, in
                    addition to brightfield imaging of H&E stained tissues.
                </p>
                <p>
                    As with sequencing data, the imaging data model is split
                    into data levels as follows:
                </p>

                <table className="table table-data-levels">
                    <thead>
                        <tr>
                            <th>Level</th>
                            <th>Description</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>1</td>
                            <td>
                                Raw imaging data requiring tiling, stitching,
                                illumination correction, registration or other
                                pre-processing.
                            </td>
                        </tr>
                        <tr>
                            <td>2</td>
                            <td>
                                Imaging data compiled into a single file format,
                                preferably a tiled and pyramidal OME-TIFF.
                                <br />
                                <br />
                                Accompanied by a csv file containing channel
                                metadata.
                            </td>
                        </tr>
                        <tr>
                            <td>3</td>
                            <td>
                                Segmentation mask, Validated channel metadata,
                                QC checked image.
                            </td>
                        </tr>
                        <tr>
                            <td>4</td>
                            <td>
                                An object-by-feature table (typically
                                cell-by-marker) generated from the segmentation
                                mask and image.
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </DataStandard>
    );
};

export const getStaticProps: GetStaticProps = async (context) => {
    const { dataSchemaData, schemaDataById } = await getDataSchema([
        SchemaDataId.ImagingLevel1,
        SchemaDataId.ImagingLevel2,
        SchemaDataId.ImagingLevel3,
        SchemaDataId.ImagingLevel4,
    ]);

    return { props: { dataSchemaData, schemaDataById } };
};

export default Imaging;
