import _ from 'lodash';
import React from 'react';

import {
    EnhancedDataTable,
    getDefaultDataTableStyle,
} from '@htan/data-portal-table';
import { Atlas, Entity, PublicationManifest } from '@htan/data-portal-commons';
import { GenericAttributeNames } from '@htan/data-portal-utils';
import { DataSchemaData } from '@htan/data-portal-schema';

import {
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

const initiallyHiddenColNames = {
    SourceHTANBiospecimenID: 'Source HTAN Biospecimen ID',
    ParticipantID: 'Participant ID',
    AdjacentBiospecimenIDs: 'Adjacent Biospecimen IDs',
    ProtocolLink: 'Protocol Link',
    SiteDataSource: 'Site Data Source',
    CollectionMedia: 'Collection Media',
    MountingMedium: 'Mounting Medium',
    ProcessingLocation: 'Processing Location',
    HistologyAssessmentBy: 'Histology Assessment By',
    HistologyAssessmentMedium: 'Histology Assessment Medium',
    PreinvasiveMorphology: 'Preinvasive Morphology',
    TumorInfiltratingLymphocytes: 'Tumor Infiltrating Lymphocytes',
    DegreeofDysplasia: 'Degree of Dysplasia',
    DysplasiaFraction: 'Dysplasia Fraction',
    NumberProliferatingCells: 'Number Proliferating Cells',
    PercentEosinophilInfiltration: 'Percent Eosinophil Infiltration',
    PercentGranulocyteInfiltration: 'Percent Granulocyte Infiltration',
    PercentInflamInfiltration: 'Percent Inflam Infiltration',
    PercentLymphocyteInfiltration: 'Percent Lymphocyte Infiltration',
    PercentMonocyteInfiltration: 'Percent Monocyte Infiltration',
    PercentNecrosis: 'Percent Necrosis',
    PercentNeutrophilInfiltration: 'Percent Neutrophil Infiltration',
    PercentNormalCells: 'Percent Normal Cells',
    PercentStromalCells: 'Percent Stromal Cells',
    PercentTumorCells: 'Percent Tumor Cells',
    PercentTumorNuclei: 'Percent Tumor Nuclei',
    FiducialMarker: 'Fiducial Marker',
    SlicingMethod: 'Slicing Method',
    LysisBuffer: 'Lysis Buffer',
    MethodofNucleicAcidIsolation: 'Method of Nucleic Acid Isolation',
    AcquisitionMethodOtherSpecify: 'Acquisition Method Other Specify',
    AnalyteType: 'Analyte Type',
    FixationDuration: 'Fixation Duration',
    HistologicMorphologyCode: 'Histologic Morphology Code',
    IschemicTemperature: 'Ischemic Temperature',
    IschemicTime: 'Ischemic Time',
    PortionWeight: 'Portion Weight',
    PreservationMethod: 'Preservation Method',
    SectionThicknessValue: 'Section Thickness Value',
    SectioningDaysfromIndex: 'Sectioning Days from Index',
    ShippingConditionType: 'Shipping Condition Type',
    SlideChargeType: 'Slide Charge Type',
    SpecimenLaterality: 'Specimen Laterality',
    TotalVolume: 'Total Volume',
    TumorTissueType: 'Tumor Tissue Type',
    BiospecimenDimension1: 'Biospecimen Dimension 1',
    BiospecimenDimension2: 'Biospecimen Dimension 2',
    BiospecimenDimension3: 'Biospecimen Dimension 3',
    DimensionsUnit: 'Dimensions Unit',
    SectionNumberinSequence: 'Section Number in Sequence',
    TotalVolumeUnit: 'Total Volume Unit',
    TopographyCode: 'Topography Code',
    AdditionalTopography: 'Additional Topography',
    synapseId: 'Synapse ID',
    level: 'Level',
    atlasid: 'Atlas ID',
};

export const BiospecimenTable: React.FunctionComponent<IBiospecimenTableProps> = (
    props
) => {
    const columns = [
        {
            name: 'HTAN Biospecimen ID',
            selector: GenericAttributeNames.BiospecimenID,
            sortFunction: sortByBiospecimenId,
            sortable: true,
        },
        {
            name: 'Atlas Name',
            selector: 'atlas_name',
            sortable: true,
        },
        getPublicationColumn(props.publicationsByUid),
        {
            name: 'HTAN Parent ID',
            selector: 'HTANParentID',
            sortFunction: sortByParentID,
            sortable: true,
        },
        {
            name: 'Timepoint Label',
            selector: 'TimepointLabel',
            sortable: true,
        },
        {
            name: 'Collection Days from Index',
            selector: 'CollectionDaysfromIndex',
            sortable: true,
        },
        {
            name: 'Biospecimen Type',
            selector: 'BiospecimenType',
            sortable: true,
        },
        {
            name: 'Acquisition Method Type',
            selector: 'AcquisitionMethodType',
            sortable: true,
        },
        {
            name: 'Fixative Type',
            selector: 'FixativeType',
            sortable: true,
        },
        {
            name: 'Storage Method',
            selector: 'StorageMethod',
            sortable: true,
        },
        {
            name: 'Processing Days from Index',
            selector: 'ProcessingDaysfromIndex',
            sortable: true,
        },
        ..._(initiallyHiddenColNames)
            .toPairs()
            .map(([key, value]) => ({
                name: value,
                selector: key,
                sortable: true,
                omit: true,
            }))
            .value(),
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
