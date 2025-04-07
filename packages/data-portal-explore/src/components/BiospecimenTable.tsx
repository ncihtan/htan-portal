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
            selector: 'HTANBiospecimenID',
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
        },
        {
            name: 'Protocol Link',
            selector: 'ProtocolLink',
        },
        {
            name: 'Site Data Source',
            selector: 'SiteDataSource',
        },
        {
            name: 'Collection Media',
            selector: 'CollectionMedia',
        },
        {
            name: 'Mounting Medium',
            selector: 'MountingMedium',
        },
        {
            name: 'Processing Location',
            selector: 'ProcessingLocation',
        },
        {
            name: 'Histology Assessment By',
            selector: 'HistologyAssessmentBy',
        },
        {
            name: 'Histology Assessment Medium',
            selector: 'HistologyAssessmentMedium',
        },
        {
            name: 'Preinvasive Morphology',
            selector: 'PreinvasiveMorphology',
        },
        {
            name: 'Tumor Infiltrating Lymphocytes',
            selector: 'TumorInfiltratingLymphocytes',
        },
        {
            name: 'Degree of Dysplasia',
            selector: 'DegreeofDysplasia',
        },
        {
            name: 'Dysplasia Fraction',
            selector: 'DysplasiaFraction',
        },
        {
            name: 'Number Proliferating Cells',
            selector: 'NumberProliferatingCells',
        },
        {
            name: 'Percent Eosinophil Infiltration',
            selector: 'PercentEosinophilInfiltration',
        },
        {
            name: 'Percent Granulocyte Infiltration',
            selector: 'PercentGranulocyteInfiltration',
        },
        {
            name: 'Percent Inflam Infiltration',
            selector: 'PercentInflamInfiltration',
        },
        {
            name: 'Percent Lymphocyte Infiltration',
            selector: 'PercentLymphocyteInfiltration',
        },
        {
            name: 'Percent Monocyte Infiltration',
            selector: 'PercentMonocyteInfiltration',
        },
        {
            name: 'Percent Necrosis',
            selector: 'PercentNecrosis',
        },
        {
            name: 'Percent Neutrophil Infiltration',
            selector: 'PercentNeutrophilInfiltration',
        },
        {
            name: 'Percent Normal Cells',
            selector: 'PercentNormalCells',
        },
        {
            name: 'Percent Stromal Cells',
            selector: 'PercentStromalCells',
        },
        {
            name: 'Percent Tumor Cells',
            selector: 'PercentTumorCells',
        },
        {
            name: 'Percent Tumor Nuclei',
            selector: 'PercentTumorNuclei',
        },
        {
            name: 'Fiducial Marker',
            selector: 'FiducialMarker',
        },
        {
            name: 'Slicing Method',
            selector: 'SlicingMethod',
        },
        {
            name: 'Lysis Buffer',
            selector: 'LysisBuffer',
        },
        {
            name: 'Method of Nucleic Acid Isolation',
            selector: 'MethodofNucleicAcidIsolation',
        },
        {
            name: 'Acquisition Method Other Specify',
            selector: 'AcquisitionMethodOtherSpecify',
        },
        {
            name: 'Analyte Type',
            selector: 'AnalyteType',
        },
        {
            name: 'Fixation Duration',
            selector: 'FixationDuration',
        },
        {
            name: 'Histologic Morphology Code',
            selector: 'HistologicMorphologyCode',
        },
        {
            name: 'Ischemic Temperature',
            selector: 'IschemicTemperature',
        },
        {
            name: 'Ischemic Time',
            selector: 'IschemicTime',
        },
        {
            name: 'Portion Weight',
            selector: 'PortionWeight',
        },
        {
            name: 'Preservation Method',
            selector: 'PreservationMethod',
        },
        {
            name: 'Section Thickness Value',
            selector: 'SectionThicknessValue',
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
