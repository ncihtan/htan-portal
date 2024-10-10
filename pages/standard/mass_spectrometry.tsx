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
                <p>
                    The current HTAN Mass Spectrometry Standard was developed
                    with a focus on Proteomics data. The standard may be refined
                    in the future to reflect other data types such as lipids and
                    metabolites.
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
                            <td>Raw spectral data</td>
                            <td>mz5,dta,ms2,ms1,mzXML,mzML,mzData</td>
                        </tr>
                        <tr>
                            <td>2</td>
                            <td>Spectrum match peaks</td>
                            <td>Peptide spectrum match (PSM) in csv format</td>
                        </tr>
                        <tr>
                            <td>3</td>
                            <td>Peptide Group information</td>
                            <td>
                                Combined peptide spectrum as csv or tsv files
                            </td>
                        </tr>
                        <tr>
                            <td>4</td>
                            <td>Protein Abundance</td>
                            <td>csv, tsv</td>
                        </tr>
                    </tbody>
                </table>
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
