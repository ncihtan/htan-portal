import React from 'react';
import { GetStaticProps } from 'next';

import DataStandard, { DataStandardProps } from '../../components/DataStandard';
import {
    getDataSchema,
    SchemaDataId,
} from '../../packages/data-portal-schema/src/libs/dataSchemaHelpers';

const Imaging: React.FunctionComponent<DataStandardProps> = (props) => {
    return (
        <DataStandard {...props}>
            <div className="standards-content">
                <h1>HTAN Sequencing Data</h1>
                <p>
                    HTAN supports multiple sequencing modalities including
                    Single Cell and Single Nucleus RNA Seq (sc/snRNASeq), Single
                    Cell ATAC Seq, Bulk RNA Seq and Bulk DNA Seq.
                </p>
                <p>
                    The HTAN standard for gene annotations is{' '}
                    <a href="https://www.gencodegenes.org/human/release_34.html">
                        GENCODE Version 34
                    </a>
                    . <a href="https://www.gencodegenes.org/">GENCODE</a> is
                    used for gene definitions by many consortia, including
                    ENCODE, NCI Genomic Data Commons, Human Cell Atlas, and
                    PCAWG (Pan-Cancer Analysis of Whole Genomes). Ensembl gene
                    content is essentially identical to that of GENCODE (
                    <a href="https://www.gencodegenes.org/pages/faq.html">
                        FAQ
                    </a>
                    ) and interconversion is possible.
                </p>
                <p>
                    HTAN has adopted the{' '}
                    <a href="https://www.gencodegenes.org/human/release_34.html">
                        GENCODE 34
                    </a>{' '}
                    Gene Transfer Format (
                    <a href="https://useast.ensembl.org/info/website/upload/gff.html">
                        GTF
                    </a>
                    ) comprehensive gene annotation file (GENCODE 34 GTF) and
                    filtered files (GENCODE 34 GTF with genes only; GENCODE 34
                    GTF with genes only and retaining only chromosome X copy of
                    pseudoautosomal region) for HTAN gene annotation. Note that
                    HTAN also includes data generated with other gene models, as
                    the process of implementing the standard is ongoing. Within
                    HTAN metadata files, the reference genome used can be found
                    in the attribute “Genomic Reference” and “Genomic Reference
                    URL”.
                </p>
                <p>
                    In alignment with The Cancer Genome Atlas and the NCI
                    Genomic Data Commons, sequencing data are divided into four
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
                            <td>Raw data</td>
                            <td>FASTQs, unaligned BAMs</td>
                        </tr>
                        <tr>
                            <td>2</td>
                            <td>Aligned primary data</td>
                            <td>Aligned BAMs</td>
                        </tr>
                        <tr>
                            <td>3</td>
                            <td>Derived biomolecular data</td>
                            <td>Gene expression matrix files, VCFs, etc.</td>
                        </tr>
                        <tr>
                            <td>4</td>
                            <td>Sample level summary data.</td>
                            <td>t-SNE plot coordinates, etc.</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </DataStandard>
    );
};

export const getStaticProps: GetStaticProps = async (context) => {
    const { dataSchemaData, schemaDataById } = await getDataSchema([
        SchemaDataId.scRNASeqLevel1,
        SchemaDataId.scRNASeqLevel2,
        SchemaDataId.scRNASeqLevel3,
        SchemaDataId.scRNASeqLevel4,
        SchemaDataId.scATACSeqLevel1,
        SchemaDataId.BulkWESLevel1,
        SchemaDataId.BulkWESLevel2,
        SchemaDataId.BulkWESLevel3,
        SchemaDataId.BulkRNASeqLevel1,
        SchemaDataId.BulkRNASeqLevel2,
        SchemaDataId.BulkRNASeqLevel3,
    ]);

    return { props: { dataSchemaData, schemaDataById } };
};

export default Imaging;
