import React from 'react';
import { GetStaticProps } from 'next';

import DataStandard, { DataStandardProps } from '../../components/DataStandard';
import { getStaticContent } from '../../ApiUtil';
import { getDataSchema, SchemaDataId } from '../../lib/dataSchemaHelpers';

const BulkDNASeq: React.FunctionComponent<DataStandardProps> = (props) => {
    return (
        <DataStandard {...props}>
            <h1>HTAN Bulk DNA Sequencing Data Standard</h1>
            <h2>Overview</h2>

            <p>
                This page describes the data levels, metadata attributes, and
                file structure for bulk DNA sequencing.
            </p>

            <h2>Description of Assay</h2>

            <p>
                Bulk DNA sequencing produces the DNA sequence of a biological
                sample. The sequence is summarized into a list of variants in
                comparison to a given reference genome. This data model should
                be applicable to assays including bulk tumor Whole Genome
                Sequencing (WGS), bulk tumor Whole Exome Sequencing (WES), bulk
                cfDNA WES (cell free), bulk tumor targeted DNA sequencing, and
                bulk ctDNA targeted DNA sequencing.
            </p>

            <h2>Metadata Levels</h2>

            <p>
                The defined metadata leverages existing common data elements
                from the{' '}
                <a href="https://gdc.cancer.gov/about-data/data-harmonization-and-generation/biospecimen-data-harmonization">
                    Genomic Data Commons (GDC)
                </a>
                . The HTAN data model currently supports Level 1, 2 and 3 DNA
                sequencing data:
            </p>

            <table className={'table'}>
                <thead>
                    <tr>
                        <th>Level Number</th>
                        <th>Definition</th>
                        <th>Example Data</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>1</td>
                        <td>Raw unaligned read data</td>
                        <td>FASTQ</td>
                    </tr>
                    <tr>
                        <td>2</td>
                        <td>Genome aligned reads</td>
                        <td>BAM</td>
                    </tr>
                    <tr>
                        <td>3</td>
                        <td>Sample level summary</td>
                        <td>VCF/ MAF</td>
                    </tr>
                </tbody>
            </table>
        </DataStandard>
    );
};

export const getStaticProps: GetStaticProps = async (context) => {
    const data = await getStaticContent(['data-standards-bulk-dnaseq-blurb']);
    const { dataSchemaData, schemaDataById } = await getDataSchema([
        SchemaDataId.BulkWESLevel1,
        SchemaDataId.BulkWESLevel2,
        SchemaDataId.BulkWESLevel3,
    ]);

    return { props: { data, dataSchemaData, schemaDataById } };
};

export default BulkDNASeq;
