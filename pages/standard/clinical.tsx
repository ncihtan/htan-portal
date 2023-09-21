import React from 'react';
import { GetStaticProps } from 'next';

import DataStandard, { DataStandardProps } from '../../components/DataStandard';
import {
    getDataSchema,
    SchemaDataId,
} from '../../packages/data-portal-schema/src/libs/dataSchemaHelpers';

const Cds: React.FunctionComponent<DataStandardProps> = (props) => {
    return (
        <DataStandard {...props}>
            <div className="standards-content">
                <h1>HTAN Clinical Data</h1>
                <p>
                    HTAN clinical data consists of three tiers.
                    <p />
                    Tier 1 is based on the{' '}
                    <a href="https://gdc.cancer.gov/about-data/gdc-data-processing/clinical-data-standardization">
                        NCI Genomic Data Commons (GDC)
                    </a>{' '}
                    clinical data model, while Tiers 2 and 3 are extensions to
                    the GDC model.
                </p>
                <table className="table table-data-levels">
                    <tr>
                        <th>Tier</th>
                        <th>Description</th>
                    </tr>

                    <tr>
                        <td>1</td>
                        <td>
                            Seven categories of clinical data, based on the GDC
                            clinical data model. See GDC Table below.
                        </td>
                    </tr>

                    <tr>
                        <td>2</td>
                        <td>
                            <b>HTAN disease-agnostic</b> extensions to the GDC
                            clinical data model.
                        </td>
                    </tr>

                    <tr>
                        <td>3</td>
                        <td>
                            <b>HTAN disease-specific</b> extensions to the GDC
                            clinical data model.
                        </td>
                    </tr>
                </table>
                <h3>Tier 1 Clinical Data</h3>
                Tier 1 clinical data consists of seven categories of data from
                the GDC Data Model.
                <p />
                <table className="table table-data-levels">
                    <tr>
                        <th>Category</th>
                        <th>Description</th>
                    </tr>
                    <tr>
                        <td>Demographics</td>
                        <td>
                            Data for the characterization of the patient by
                            means of segmenting the population (e.g.,
                            characterization by age, sex, or race).
                        </td>
                    </tr>
                    <tr>
                        <td>Diagnosis</td>
                        <td>
                            Data from the investigation, analysis and
                            recognition of the presence and nature of disease,
                            condition, or injury from expressed signs and
                            symptoms; also, the scientific determination of any
                            kind; the concise results of such an investigation.
                        </td>
                    </tr>
                    <tr>
                        <td>Exposure</td>
                        <td>
                            Clinically relevant patient information not
                            immediately resulting from genetic predispositions.
                        </td>
                    </tr>
                    <tr>
                        <td>Family History</td>
                        <td>
                            Record of a patient's background regarding cancer
                            events of blood relatives.
                        </td>
                    </tr>
                    <tr>
                        <td>Follow-up</td>
                        <td>
                            A visit by a patient or study participant to a
                            medical professional. A clinical encounter that
                            encompasses planned and unplanned trial
                            interventions, procedures and assessments that may
                            be performed on a subject. A visit has a start and
                            an end, each described with a rule. The process by
                            which information about the health status of an
                            individual is obtained before and after a study has
                            officially closed; an activity that continues
                            something that has already begun or that repeats
                            something that has already been done.
                        </td>
                    </tr>
                    <tr>
                        <td>Molecular Test</td>
                        <td>
                            Information pertaining to any molecular tests
                            performed on the patient during a clinical event.
                        </td>
                    </tr>
                    <tr>
                        <td>Therapy</td>
                        <td>
                            Record of the administration and intention of
                            therapeutic agents provided to a patient to alter
                            the course of a pathologic process.
                        </td>
                    </tr>
                </table>
                <h3>Tiers 2 and 3 Clinical Data</h3>
                <p>
                    Tier 2 consists of <b>disease-agnostic</b> extensions to the
                    GDC clinical data model.
                </p>
                <p>
                    Tier 3 consists of <b>disease-specific</b> extensions to the
                    GDC clinical data model. This covers additional elements for
                    Acute Lymphoblastic Leukemia (ALL), Brain Cancer, Breast
                    Cancer, Lung Cancer, Melanoma, Ovarian Cancer, Pancreatic
                    Cancer, Prostate Cancer and Sarcoma.
                </p>
            </div>
        </DataStandard>
    );
};

export const getStaticProps: GetStaticProps = async (context) => {
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
