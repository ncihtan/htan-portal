import React from 'react';
import { GetStaticProps } from 'next';

import DataStandard, { DataStandardProps } from '../../components/DataStandard';
import { getStaticContent } from '../../ApiUtil';
import { getDataSchema, SchemaDataId } from '../../lib/dataSchemaHelpers';

const Cds: React.FunctionComponent<DataStandardProps> = (props) => {
    return (
        <DataStandard {...props}>
            <h1>Clinical Data</h1>

            <h2>Overview</h2>

            <p>
                This page describes the data tiers and data collection for the
                HTAN clinical data standard.
            </p>

            <h2>Description of Model</h2>

            <p>
                HTAN clinical data consists of four tiers. Tier 1 is in
                alignment with the Genomic Data Commons (GDC) guidelines for
                clinical data, while Tier 2, 3 and 4 are extensions to this
                model.
            </p>

            <table className="table">
                <tr>
                    <th>Tier</th>
                    <th>Description</th>
                </tr>

                <tr>
                    <td>1</td>
                    <td>
                        Demographics, Diagnosis, Exposure, Treatment, Follow-up,
                        Molecular Test and Family History
                    </td>
                </tr>

                <tr>
                    <td>2</td>
                    <td>Disease-agnostic extensions to the GDC</td>
                </tr>

                <tr>
                    <td>3</td>
                    <td>Disease-specific extensions to the GDC</td>
                </tr>

                <tr>
                    <td>4</td>
                    <td>
                        HTAN Research Network Atlas-specific clinical data
                        elements not covered in a previous tier and that are
                        recognized as a requirement by the atlas. These are
                        attributes specific to an atlas
                    </td>
                </tr>
            </table>

            <h4>
                <i>Tier 1 Clinical Data</i>
            </h4>

            <p>
                To establish consistency across HTAN atlases and tumor types,
                the HTAN Tier 1 clinical data consists of GDC clinical data
                elements defined as Required, Preferred and Optional. The HTAN
                CDE Dictionary contains a comprehensive list of elements
                attributed as Required, Preferred and Optional.
            </p>

            <ul>
                <li>
                    Required CDE: Data submitters must provide a value for this
                    attribute; “Unknown”, “Not Reported” or “null” are valid
                    values for many of these attributes if the required
                    information is missing for a subset of patients
                </li>
                <li>
                    Preferred CDE: Data submitters are strongly recommended to
                    provide values for this attribute
                </li>
                <li>
                    Optional CDE: Data submitters can populate this attribute
                    based on availability of the data requested
                </li>
            </ul>

            <h4>
                <i>Tier 2 Clinical Data</i>
            </h4>

            <p>
                Describes disease-agnostic extensions to the GDC not included in
                Tier 1 Clinical Data that were suggested for inclusion by the
                HTAN Research Network. These suggested CDEs were compared to NCI
                standards described in the caDSR system and the most similar CDE
                was selected for inclusion in the HTAN Clinical Data model. If
                no comparable CDE was found for a particular element, an
                HTAN-specific CDE was developed.
            </p>

            <h4>
                <i>Tier 3 Clinical Data</i>
            </h4>

            <p>
                Describes disease-specific extensions to the GDC not included in
                Tier 1 Clinical Data that were suggested for inclusion by the
                HTAN Research Network. These suggested CDEs were compared to NCI
                standards described in the caDSR system and the most similar CDE
                was selected for inclusion in the HTAN Clinical Data model. If
                no comparable CDE was found for a particular element, an
                HTAN-specific CDE was developed.
            </p>

            <p>Attributes are divided by tumor type:</p>

            <ul>
                <li>Melanoma-specific</li>
                <li>
                    Lung pre-cancer and cancer-specific Colorectal pre-cancer
                    and cancer-specific
                </li>
                <li>Breast pre-cancer and cancer-specific</li>
                <li>Neuroblastoma-specific</li>
                <li>Glioma-specific</li>
                <li>Pancreatic pre-cancer and cancer-specific</li>
                <li>Acute lymphoblastic leukemia-specific</li>
                <li>Sarcoma-specific</li>
                <li>Ovarian pre-cancer and cancer-specific</li>
                <li>Prostate pre-cancer and cancer-specific</li>
            </ul>

            <h4>
                <i>Tier 3 Clinical Data</i>
            </h4>
            <p>
                Describes clinical data elements identified as required to be
                included in the HTAN data model and specific to an atlas, and
                not covered in a previous tier.
            </p>
        </DataStandard>
    );
};

export const getStaticProps: GetStaticProps = async (context) => {
    //const data = await getStaticContent(['data-standards-cds-blurb']);

    // TODO this may not be the complete list of clinical data
    const { dataSchemaData, schemaDataById } = await getDataSchema([
        SchemaDataId.Demographics,
        SchemaDataId.Diagnosis,
        SchemaDataId.Exposure,
        SchemaDataId.FamilyHistory,
        SchemaDataId.FollowUp,
        SchemaDataId.MolecularTest,
        SchemaDataId.Therapy,
        SchemaDataId.ClinicalDataTier2,
        SchemaDataId.AcuteLymphoblasticLeukemiaTier3,
        SchemaDataId.BrainCancerTier3,
        SchemaDataId.BreastCancerTier3,
        SchemaDataId.ColorectalCancerTier3,
        SchemaDataId.LungCancerTier3,
        SchemaDataId.MelanomaTier3,
        SchemaDataId.OvarianCancerTier3,
        SchemaDataId.PancreaticCancerTier3,
        SchemaDataId.ProstateCancerTier3,
        SchemaDataId.SarcomaTier3,
    ]);

    return { props: { dataSchemaData, schemaDataById } };
};

export default Cds;
