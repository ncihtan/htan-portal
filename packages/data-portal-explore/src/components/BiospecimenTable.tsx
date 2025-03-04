import _ from 'lodash';
import React from 'react';

import {
    EnhancedDataTable,
    getDefaultDataTableStyle,
} from '@htan/data-portal-table';
import { Atlas, Entity, PublicationManifest } from '@htan/data-portal-commons';
import { GenericAttributeNames } from '@htan/data-portal-utils';
import { DataSchemaData, SchemaDataId } from '@htan/data-portal-schema';

import {
    generateColumnsForDataSchema,
    getAtlasColumn,
    getPublicationColumn,
    sortByBiospecimenId,
    sortByParentID,
} from '../lib/dataTableHelpers';

interface IBiospecimenTableProps {
    samples: Entity[];
    synapseAtlases: Atlas[];
    schemaDataById?: { [schemaDataId: string]: DataSchemaData };
    genericAttributeMap?: { [attr: string]: GenericAttributeNames };
    publicationsByUid?: { [uid: string]: PublicationManifest };
}

export const BiospecimenTable: React.FunctionComponent<IBiospecimenTableProps> = (
    props
) => {
    const columns = [
        {
            name: 'HTAN Biospecimen ID',
            selector: GenericAttributeNames.BiospecimenID,
            sortFunction: sortByBiospecimenId,
        },
        {
            name: 'Atlas Name',
            selector: 'atlas_name',
        },
        getPublicationColumn(props.publicationsByUid),
        {
            name: 'HTAN Parent ID',
            selector: 'HTANParentID',
        },
        {
            name: 'Timepoint Label',
            selector: 'TimepointLabel',
        },
        {
            name: 'Collection Days from Index',
            selector: 'CollectionDaysfromIndex',
        },

        {
            name: 'Biospecimen Type',
            selector: 'BiospecimenType',
        },
        {
            name: 'Acquisition Method Type',
            selector: 'AcquisitionMethodType',
        },
        {
            name: 'Fixative Type',
            selector: 'FixativeType',
        },
        {
            name: 'Storage Method',
            selector: 'StorageMethod',
        },
        {
            name: 'Processing Days from Index',
            selector: 'ProcessingDaysfromIndex',
        },
        {
            name: 'Adjacent Biospecimen IDs',
            selector: 'AdjacentBiospecimenIDs',
            omit: true,
        },
        {
            name: 'Protocol Link',
            selector: 'ProtocolLink',
        },
        {
            name: 'Site Data Source',
            selector: 'SiteDataSource',
            omit: true,
        },
        {
            name: 'Collection Media',
            selector: 'CollectionMedia',
            omit: true,
        },
        {
            name: 'Mounting Medium',
            selector: 'MountingMedium',
            omit: true,
        },
        {
            name: 'Processing Location',
            selector: 'ProcessingLocation',
            omit: true,
        },
        {
            name: 'Histology Assessment By',
            selector: 'HistologyAssessmentBy',
            omit: true,
        },
        {
            name: 'Histology Assessment Medium',
            selector: 'HistologyAssessmentMedium',
            omit: true,
        },
        {
            name: 'Preinvasive Morphology',
            selector: 'PreinvasiveMorphology',
            omit: true,
        },
        {
            name: 'Tumor Infiltrating Lymphocytes',
            selector: 'TumorInfiltratingLymphocytes',
        },
        {
            name: 'Degree of Dysplasia',
            selector: 'DegreeofDysplasia',
            omit: true,
        },
        {
            name: 'Dysplasia Fraction',
            selector: 'DysplasiaFraction',
            omit: true,
        },
        {
            name: 'Number Proliferating Cells',
            selector: 'NumberProliferatingCells',
            omit: true,
        },
        {
            name: 'Percent Eosinophil Infiltration',
            selector: 'PercentEosinophilInfiltration',
            omit: true,
        },
        {
            name: 'Percent Granulocyte Infiltration',
            selector: 'PercentGranulocyteInfiltration',
            omit: true,
        },
        {
            name: 'Percent Inflam Infiltration',
            selector: 'PercentInflamInfiltration',
            omit: true,
        },
        {
            name: 'Percent Lymphocyte Infiltration',
            selector: 'PercentLymphocyteInfiltration',
            omit: true,
        },
        {
            name: 'Percent Monocyte Infiltration',
            selector: 'PercentMonocyteInfiltration',
            omit: true,
        },
        {
            name: 'Percent Necrosis',
            selector: 'PercentNecrosis',
            omit: true,
        },
        {
            name: 'Percent Neutrophil Infiltration',
            selector: 'PercentNeutrophilInfiltration',
            omit: true,
        },
        {
            name: 'Percent Normal Cells',
            selector: 'PercentNormalCells',
            omit: true,
        },
        {
            name: 'Percent Stromal Cells',
            selector: 'PercentStromalCells',
            omit: true,
        },
        {
            name: 'Percent Tumor Cells',
            selector: 'PercentTumorCells',
            omit: true,
        },
        {
            name: 'Percent Tumor Nuclei',
            selector: 'PercentTumorNuclei',
            omit: true,
        },
        {
            name: 'Fiducial Marker',
            selector: 'FiducialMarker',
            omit: true,
        },
        {
            name: 'Slicing Method',
            selector: 'SlicingMethod',
            omit: true,
        },
        {
            name: 'Lysis Buffer',
            selector: 'LysisBuffer',
            omit: true,
        },
        {
            name: 'Method of Nucleic Acid Isolation',
            selector: 'MethodofNucleicAcidIsolation',
            omit: true,
        },
        {
            name: 'Acquisition Method Other Specify',
            selector: 'AcquisitionMethodOtherSpecify',
            omit: true,
        },
        {
            name: 'Analyte Type',
            selector: 'AnalyteType',
            omit: true,
        },
        {
            name: 'Fixation Duration',
            selector: 'FixationDuration',
            omit: true,
        },
        {
            name: 'Histologic Morphology Code',
            selector: 'HistologicMorphologyCode',
            omit: true,
        },
        {
            name: 'Ischemic Temperature',
            selector: 'IschemicTemperature',
            omit: true,
        },
        {
            name: 'Ischemic Time',
            selector: 'IschemicTime',
            omit: true,
        },
        {
            name: 'Portion Weight',
            selector: 'PortionWeight',
            omit: true,
        },
        {
            name: 'Preservation Method',
            selector: 'PreservationMethod',
            omit: true,
        },
        {
            name: 'Section Thickness Value',
            selector: 'SectionThicknessValue',
            omit: true,
        },
        {
            name: 'Sectioning Days from Index',
            selector: 'SectioningDaysfromIndex',
        },
        {
            name: 'Shipping Condition Type',
            selector: 'ShippingConditionType',
        },
        {
            name: 'Slide Charge Type',
            selector: 'SlideChargeType',
        },
        {
            name: 'Specimen Laterality',
            selector: 'SpecimenLaterality',
        },
        {
            name: 'Total Volume',
            selector: 'TotalVolume',
        },
        {
            name: 'Tumor Tissue Type',
            selector: 'TumorTissueType',
        },
        {
            name: 'atlasid',
            selector: 'atlasid',
        },
        // {
        //     "name": "level",
        //     "selector": "level"
        // },
        {
            name: 'Assay Name',
            selector: 'assayName',
        },
        // {
        //     "name": "Atlas Meta",
        //     "selector": "AtlasMeta"
        // },
    ];

    return (
        <EnhancedDataTable
            defaultSortField={GenericAttributeNames.BiospecimenID}
            columns={columns}
            data={props.samples}
            striped={true}
            dense={false}
            noHeader={true}
            pagination={true}
            paginationPerPage={50}
            paginationRowsPerPageOptions={[10, 20, 50, 100, 500]}
            customStyles={getDefaultDataTableStyle()}
        />
    );
};

export default BiospecimenTable;
