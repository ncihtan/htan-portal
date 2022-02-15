import React from 'react';
import { GetStaticProps } from 'next';

import DataStandard, { DataStandardProps } from '../../components/DataStandard';
import { getStaticContent } from '../../ApiUtil';
import { getDataSchema, SchemaDataId } from '../../lib/dataSchemaHelpers';

const BulkRNASeq: React.FunctionComponent<DataStandardProps> = (props) => {
    return (
        <DataStandard {...props}>
            <h1>HTAN Bulk RNA Sequencing Data Standard</h1>

            <h2>Overview</h2>

            <p>
                This page describes the data levels, metadata attributes, and
                file structure for bulk RNA sequencing.
            </p>

            <h2>Description of Assay</h2>

            <p>
                Bulk RNA sequencing identifies the average gene expression
                profile of a biological sample.
            </p>

            <h2>Metadata Levels</h2>

            <p>
                The defined metadata leverages existing common data elements
                from the{' '}
                <a href="https://gdc.cancer.gov/about-data/data-harmonization-and-generation/biospecimen-data-harmonization">
                    Genomic Data Commons (GDC)
                </a>
                . The HTAN data model currently supports Level 1, 2 and 3 RNA
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
                        <td>Unaligned reads</td>
                        <td>FASTQ</td>
                    </tr>
                    <tr>
                        <td>2</td>
                        <td>Aligned reads</td>
                        <td>BAM</td>
                    </tr>
                    <tr>
                        <td>3</td>
                        <td>Gene level expression, unnormalized</td>
                        <td>Gene &amp; isoform expression-level data (.csv)</td>
                    </tr>
                </tbody>
            </table>
        </DataStandard>
    );
};

export const getStaticProps: GetStaticProps = async (context) => {
    const data = await getStaticContent(['data-standards-bulk-rnaseq-blurb']);
    const { dataSchemaData, schemaDataById } = await getDataSchema([
        SchemaDataId.BulkRNASeqLevel1,
        SchemaDataId.BulkRNASeqLevel2,
        SchemaDataId.BulkRNASeqLevel3,
    ]);

    return { props: { data, dataSchemaData, schemaDataById } };
};

export default BulkRNASeq;
