import React from 'react';
import { GetStaticProps } from 'next';

import DataStandard, { DataStandardProps } from '../../components/DataStandard';
import { getStaticContent } from '../../ApiUtil';
import { getDataSchema, SchemaDataId } from '../../lib/dataSchemaHelpers';

const Biospecimen: React.FunctionComponent<DataStandardProps> = (props) => {
    return (
        <DataStandard {...props}>
            <h1>HTAN Biospecimen Data Standard</h1>
            <h2>Overview</h2>
            <p>
                This page describes the data levels and data collection for the
                HTAN biospecimen data standard.
            </p>
            <h2>Description of Model</h2>
            <p>
                The HTAN biospecimen data model is designed to capture essential
                biospecimen data elements, including:
            </p>
            <ul>
                <li>
                    Acquisition method, e.g. autopsy, biopsy, fine needle
                    aspirate, etc.
                </li>
                <li>
                    Topography Code, indicating site within the body, e.g. based
                    on ICD-O-3.
                </li>
                <li>
                    Collection information e.g. time, duration of ischemia,
                    temperature, etc.&nbsp;&nbsp;
                </li>
                <li>
                    Processing of parent biospecimen information e.g. fresh,
                    frozen, etc.&nbsp;
                </li>
                <li>
                    Biospecimen and derivative clinical metadata ie Histologic
                    Morphology Code, e.g. based on ICD-O-3.
                </li>
                <li>
                    Coordinates for derivative biospecimen from their parent
                    biospecimen.
                </li>
                <li>
                    Processing of derivative biospecimen for downstream analysis
                    e.g. dissociation, sectioning, analyte isolation, etc.
                </li>
            </ul>
            <p>The model consists of two tiers:</p>
            <table className={'table'}>
                <tbody>
                    <tr>
                        <th>Data Level</th>
                        <th>Description</th>
                    </tr>
                    <tr>
                        <td>Tier 1</td>
                        <td>
                            Base biospecimen data common to most assays and HTAN
                            Research Network atlases
                        </td>
                    </tr>
                    <tr>
                        <td>Tier 2</td>
                        <td>
                            Assay-specific or atlas-specific extensions to the
                            base model
                        </td>
                    </tr>
                </tbody>
            </table>
            <h4>Biospecimen Tier 1</h4>
            <p>
                Baseline HTAN biospecimen data leverages existing common data
                elements from four sources:
            </p>
            <ul>
                <li>
                    <a href="https://gdc.cancer.gov/about-data/data-harmonization-and-generation/biospecimen-data-harmonization">
                        Genomic Data Commons (GDC)
                    </a>
                </li>
                <li>
                    <a href="https://mcl.nci.nih.gov/resources/standards/mcl-cdes">
                        Consortium for Molecular and Cellular Characterization
                        of Screen-Detected Lesions (MCL)
                    </a>
                </li>
                <li>
                    <a href="https://data.humancellatlas.org/metadata">
                        Human Cell Atlas (HCA)
                    </a>
                </li>
                <li>
                    <a href="https://cdebrowser.nci.nih.gov/cdebrowserClient/cdeBrowser.html#/search">
                        NCI standards described in the caDSR system
                    </a>
                </li>
            </ul>
            <p>
                Additionally, if a comparable CDE could not be found in these
                sources for a specific attribute, an HTAN-specific attribute was
                created.
            </p>
            <h4>Biospecimen Tier 2</h4>
            <p>
                Attributes identified for inclusion in Tier 2 include those
                described in the{' '}
                <a href="https://cdebrowser.nci.nih.gov/cdebrowserClient/cdeBrowser.html#/search">
                    caDSR system
                </a>{' '}
                and, similarly to Tier 1, HTAN-specific elements:
            </p>
            <ul>
                <li>
                    <b>Atlas-specific – </b>Attributes that are atlas specific,
                    but may used by more than 1 atlas.
                </li>
                <li>
                    <b>Histological Assessment – </b>Biospecimen attributes
                    specific to histological assessment.
                </li>
                <li>
                    <b>Multiplex Image Staining </b>– Biospecimen attributes
                    specific to multiplex image staining.
                </li>
                <li>
                    <b>Single Cell RNA / Single Nucleus RNA Seq </b>–
                    Biospecimen attributes specific to Single Cell RNA / Single
                    Nucleus RNA Seq
                </li>
                <li>
                    <b>Bulk RNA &amp; DNA Seq </b>– Biospecimen attributes
                    specific to Bulk RNA &amp; DNA Seq
                </li>
            </ul>
        </DataStandard>
    );
};

export const getStaticProps: GetStaticProps = async (context) => {
    const data = await getStaticContent(['data-standards-biospecimen-blurb']);
    const { dataSchemaData, schemaDataById } = await getDataSchema([
        SchemaDataId.Biospecimen,
    ]);

    return { props: { data, dataSchemaData, schemaDataById } };
};

export default Biospecimen;
