import React from 'react';
import { GetServerSideProps } from 'next';

import {
    getAllAttributes,
    getDataSchema,
    SchemaDataId,
} from '@htan/data-portal-schema';
import DataStandard, {
    DataStandardProps,
} from '../../../components/DataStandard';
import { getFirstIdFromContext } from '../../../lib/helpers';

const Biospecimen: React.FunctionComponent<DataStandardProps> = (props) => {
    return (
        <DataStandard {...props}>
            <div className="standards-content">
                <h1>HTAN Biospecimen Data</h1>
                <p>
                    The HTAN biospecimen data model is designed to capture
                    essential biospecimen data elements, including:
                </p>
                <ul>
                    <li>
                        Acquisition method, e.g. autopsy, biopsy, fine needle
                        aspirate, etc.
                    </li>
                    <li>
                        Topography Code, indicating site within the body, e.g.
                        based on ICD-O-3.
                    </li>
                    <li>
                        Collection information e.g. time, duration of ischemia,
                        temperature, etc.
                    </li>
                    <li>
                        Processing of parent biospecimen information e.g. fresh,
                        frozen, etc.
                    </li>
                    <li>
                        Biospecimen and derivative clinical metadata i.e.
                        Histologic Morphology Code, e.g. based on ICD-O-3.
                    </li>
                    <li>
                        Coordinates for derivative biospecimen from their parent
                        biospecimen.
                    </li>
                    <li>
                        Processing of derivative biospecimen for downstream
                        analysis e.g. dissociation, sectioning, analyte
                        isolation, etc.
                    </li>
                </ul>
                <p>
                    HTAN biospecimen metadata leverages existing common data
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
                            Consortium for Molecular and Cellular
                            Characterization of Screen-Detected Lesions (MCL)
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
            </div>
        </DataStandard>
    );
};

export const getServerSideProps: GetServerSideProps = async (context) => {
    const { dataSchemaData, schemaDataById } = await getDataSchema([
        SchemaDataId.Biospecimen,
    ]);
    const allAttributes = getAllAttributes(dataSchemaData, schemaDataById);

    return {
        props: {
            dataSchemaData,
            schemaDataById,
            allAttributes,
            manifestId: getFirstIdFromContext(context),
        },
    };
};

export default Biospecimen;
