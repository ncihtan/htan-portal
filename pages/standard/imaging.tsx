import React from 'react';
import { GetStaticProps } from 'next';

import DataStandard, { DataStandardProps } from '../../components/DataStandard';
import { getStaticContent } from '../../ApiUtil';
import { getDataSchema, SchemaDataId } from '../../lib/dataSchemaHelpers';

const Imaging: React.FunctionComponent<DataStandardProps> = (props) => {
    return (
        <DataStandard {...props}>
            <h1>Overview</h1>

            <p>
                This page describes the assays and data levels for the HTAN
                imaging data model.
            </p>

            <h2>Description of Standard</h2>

            <p>
                The HTAN imaging data model captures attributes from all HTAN
                experiments for which imaging data is generated, including:
            </p>

            <ul>
                <li>H&E</li>
                <li>t-CyCif</li>
                <li>MxIF</li>
                <li>Clinical and Multiplex IHC</li>
                <li>SABER</li>
                <li>IMC</li>
                <li>MIBI</li>
                <li>CODEX</li>
                <li>GeoMx-DSP</li>
                <li>MERFISH</li>
                <li>Metadata Levels</li>
            </ul>

            <p>The HTAN data model currently supports Level 2 image data:</p>

            <table className={'table'}>
                <thead>
                    <tr>
                        <th>Level Number Definition</th>
                        <th>Allowed file types</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>2</td>
                        <td>Pre-processed image data OME-TIFF*</td>
                    </tr>
                </tbody>
            </table>

            <p>
                * OME-TIFF files are required to contain image pyramids (unless
                the full image is relatively small, or a pyramid representation
                is not appropriate, for example for a segmentation mask),
                conforming to BioFormats 6.0.0 (or later), with compression
                strongly suggested.
            </p>

            <p>
                Metadata elements have been collected from the OME-XML metadata
                standard, as well as the extension proposed by the 4D Nucleosome
                Imaging Standards Working Group, which divides fluorescence
                microscopy data provenance metadata into categories:
            </p>

            <ul>
                <li>
                    biospecimen preparation — eg fixation, staining, and
                    mounting conditions
                </li>
                <li>
                    experimental — eg tissue culture conditions, number of
                    conditions and/or replicates
                </li>
                <li>
                    image acquisition — eg microscope specification, imaging
                    settings
                </li>
                <li>
                    image data structure — eg number of focal planes, targets
                    (aka channels), and/or time points, dimensions (including
                    order), resolution/pixel size
                </li>
                <li>
                    data analysis — ie details regarding algorithms (including
                    versions and parameters) used for any processing steps used
                    to generate an image file
                </li>
            </ul>
        </DataStandard>
    );
};

export const getStaticProps: GetStaticProps = async (context) => {
    const data = await getStaticContent(['data-standards-imaging-blurb']);
    const { dataSchemaData, schemaDataById } = await getDataSchema([
        SchemaDataId.Imaging,
        SchemaDataId.ImagingLevel2,
    ]);

    return { props: { data, dataSchemaData, schemaDataById } };
};

export default Imaging;
