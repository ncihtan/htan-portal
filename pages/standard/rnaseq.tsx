import React from 'react';
import { GetStaticProps } from 'next';

import DataStandard, { DataStandardProps } from '../../components/DataStandard';
import { getStaticContent } from '../../ApiUtil';
import { getDataSchema, SchemaDataId } from '../../lib/dataSchemaHelpers';

const RnaSeq: React.FunctionComponent<DataStandardProps> = (props) => {
    return (
        <DataStandard {...props}>
            <h1>
                HTAN Single Cell/Single Nucleus RNA Sequencing Data Standard
            </h1>

            <h2>Overview</h2>

            <p>
                This page describes the data levels, metadata attributes, and
                file structure for single cell and single nucleus RNA sequencing
                assays.
            </p>

            <h2>Description of Assay</h2>

            <p>
                Single cell RNA sequencing is an emerging technology used to
                investigate the expression profiles of individual cells and/or
                nuclei. This technique is becoming increasingly useful for
                investigating the tumor microenvironment, which is composed of a
                heterogeneous population of cancer cells and tumor-adjacent
                stromal cells. In these experiments, tissues are enzymatically
                dissociated, and individual cells are isolated via microfluidics
                using oil droplet emulsion. Similarly to bulk RNA sequencing,
                individual transcriptomes are then uniquely tagged, reversed
                transcribed, amplified and sequenced. While sc-RNA sequencing
                captures both cytoplasmic and nuclear transcripts, single
                nucleus RNA sequencing measures the transcriptome of individual
                nuclei. Advantages of sn-RNA sequencing include differentiating
                cell states and identifying rare or novel cell types in
                heterogeneous populations.
            </p>

            <p>
                In alignment with{' '}
                <a href="https://gdc.cancer.gov/resources-tcga-users/tcga-code-tables/data-levels">
                    The Cancer Genome Atlas &amp; NCI Genomic Data Commons
                </a>
                , data are divided into levels:
            </p>

            <table className={'table'}>
                <tbody>
                    <tr>
                        <td>Level Number</td>
                        <td>Definition</td>
                        <td>Example Data</td>
                    </tr>
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
                        <td>Gene expression matrix files, VCFs</td>
                    </tr>
                    <tr>
                        <td>4</td>
                        <td>Sample level summary data</td>
                        <td>t-SNE plot coordinates</td>
                    </tr>
                </tbody>
            </table>
        </DataStandard>
    );
};

export const getStaticProps: GetStaticProps = async (context) => {
    const data = await getStaticContent(['data-standards-rnaseq-blurb']);
    const { dataSchemaData, schemaDataById } = await getDataSchema([
        SchemaDataId.scRNASeqLevel1,
        SchemaDataId.scRNASeqLevel2,
        SchemaDataId.scRNASeqLevel3,
        SchemaDataId.scRNASeqLevel4,
    ]);

    return { props: { data, dataSchemaData, schemaDataById } };
};

export default RnaSeq;
