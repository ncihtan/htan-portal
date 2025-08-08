import _ from 'lodash';
import React from 'react';

import {
    EnhancedDataTable,
    getDefaultDataTableStyle,
} from '@htan/data-portal-table';
import {
    convertAgeInDaysToYears,
    GenericAttributeNames,
} from '@htan/data-portal-utils';
import { Atlas, Entity, PublicationManifest } from '@htan/data-portal-commons';
import {
    getPublicationColumn,
    sortByParticipantId,
} from '../lib/dataTableHelpers';
import { DataSchemaData } from '@htan/data-portal-schema';

interface ICaseTableProps {
    cases: Entity[];
    synapseAtlases: Atlas[];
    schemaDataById?: { [schemaDataId: string]: DataSchemaData };
    excludedColumns?: string[];
    genericAttributeMap?: { [attr: string]: GenericAttributeNames };
    publicationsByUid?: { [uid: string]: PublicationManifest };
}

const initiallyHiddenColNames = {
    VitalStatus: 'Vital Status',
    DaystoBirth: 'Days To Birth',
    CountryofResidence: 'Country Of Residence',
    AgeIsObfuscated: 'Age Is Obfuscated',
    YearOfBirth: 'Year Of Birth',
    OccupationDurationYears: 'Occupation Duration Years',
    PrematureAtBirth: 'Premature At Birth',
    WeeksGestationatBirth: 'Weeks Gestationat Birth',
    CauseofDeath: 'Cause of Death',
    CauseofDeathSource: 'Cause of Death Source',
    DaystoDeath: 'Days to Death',
    YearofDeath: 'Year of Death',
    EducationLevel: 'EducationLevel',
    MedicallyUnderservedArea: 'Medically Underserved Area',
    RuralvsUrban: 'Rural vs Urban',
    YearofDiagnosis: 'Year Of Diagnosis',
    PrecancerousConditionType: 'Precancerous Condition Type',
    TumorGrade: 'Tumor Grade',
    ProgressionorRecurrence: 'Progression or Recurrence',
    MethodofDiagnosis: 'Method of Diagnosis',
    PriorMalignancy: 'Prior Malignancy',
    PriorTreatment: 'Prior Treatment',
    MetastasisatDiagnosis: 'Metastasis at Diagnosis',
    MetastasisatDiagnosisSite: 'Metastasis at Diagnosis Site',
    FirstSymptomPriortoDiagnosis: 'First Symptom Prior to Diagnosis',
    DaystoDiagnosis: 'Days to Diagnosis',
    PercentTumorInvasion: 'Percent Tumor Invasion',
    ResidualDisease: 'Residual Disease',
    SynchronousMalignancy: 'Synchronous Malignancy',
    TumorConfinedtoOrganofOrigin: 'Tumor Confined to Organ of Origin',
    TumorFocality: 'Tumor Focality',
    TumorLargestDimensionDiameter: 'Tumor Largest Dimension Diameter',
    BreslowThickness: 'Breslow Thickness',
    VascularInvasionPresent: 'Vascular Invasion Present',
    VascularInvasionType: 'Vascular Invasion Type',
    AnaplasiaPresent: 'Anaplasia Present',
    AnaplasiaPresentType: 'Anaplasia Present Type',
    Laterality: 'Laterality',
    PerineuralInvasionPresent: 'Perineural Invasion Present',
    LymphaticInvasionPresent: 'Lymphatic Invasion Present',
    LymphNodesPositive: 'Lymph Nodes Positive',
    LymphNodesTested: 'Lymph Nodes Tested',
    PeritonealFluidCytologicalStatus: 'Peritoneal Fluid Cytological Status',
    ClassificationofTumor: 'Classification of Tumor',
    BestOverallResponse: 'Best Overall Response',
    MitoticCount: 'Mitotic Count',
    AJCCClinicalM: 'AJCC Clinical M',
    AJCCClinicalN: 'AJCC Clinical N',
    AJCCClinicalStage: 'AJCC Clinical Stage',
    AJCCClinicalT: 'AJCC Clinical T',
    AJCCPathologicM: 'AJCC Pathologic M',
    AJCCPathologicN: 'AJCC Pathologic N',
    AJCCPathologicStage: 'AJCC Pathologic Stage',
    AJCCPathologicT: 'AJCC Pathologic T',
    AJCCStagingSystemEdition: 'AJCC Staging System Edition',
    CogNeuroblastomaRiskGroup: 'Cog Neuroblastoma Risk Group',
    CogRhabdomyosarcomaRiskGroup: 'Cog Rhabdomyosarcoma Risk Group',
    GreatestTumorDimension: 'Greatest Tumor Dimension',
    IGCCCGStage: 'IGCCCG Stage',
    INPCGrade: 'INPC Grade',
    INPCHistologicGroup: 'INPC Histologic Group',
    INRGStage: 'INRG Stage',
    INSSStage: 'INSS Stage',
    IRSGroup: 'IRS Group',
    IRSStage: 'IRS Stage',
    ISSStage: 'ISS Stage',
    LymphNodeInvolvedSite: 'Lymph Node Involved Site',
    MarginDistance: 'Margin Distance',
    MicropapillaryFeatures: 'Micropapillary Features',
    PregnantatDiagnosis: 'Pregnant at Diagnosis',
    SupratentorialLocalization: 'Supratentorial Localization',
    TumorDepth: 'Tumor Depth',
    WHOCNSGrade: 'WHOCNS Grade',
    DaystoProgression: 'Days to Progression',
    DaystoProgressionFree: 'Days to Progression Free',
    DaystoRecurrence: 'Days to Recurrence',
    GeneSymbol: 'Gene Symbol',
    MolecularAnalysisMethod: 'Molecular Analysis Method',
    TestResult: 'Test Result',
    synapseId: 'Synapse ID',
    level: 'Level',
    atlasid: 'Atlas ID',
};

const cols = [
    {
        name: 'HTAN Participant ID',
        selector: GenericAttributeNames.ParticipantID,
        sortable: true,
        sortFunction: sortByParticipantId,
    },
    {
        name: 'Atlas Name',
        selector: 'atlas_name',
        sortable: true,
    },
    {
        name: 'Age at Diagnosis (years)',
        headerTooltip:
            'Age at the time of diagnosis expressed in number of years since birth.',
        format: (sample: Entity) =>
            convertAgeInDaysToYears(sample.AgeatDiagnosis),
        cell: (sample: Entity) => (
            <span className="ml-auto">
                {convertAgeInDaysToYears(sample.AgeatDiagnosis)}
            </span>
        ),
        sortable: true,
    },
    {
        name: 'Primary Diagnosis',
        selector: 'PrimaryDiagnosis',
        sortable: true,
    },
    {
        name: 'Site of Resection or Biopsy',
        selector: 'SiteofResectionorBiopsy',
        sortable: true,
    },
    {
        name: 'Tissue or Organ of Origin',
        selector: 'TissueorOrganofOrigin',
        sortable: true,
    },
    {
        name: 'Morphology',
        selector: 'Morphology',
        sortable: true,
    },
    {
        name: 'Last Known Disease Status',
        selector: 'LastKnownDiseaseStatus',
        sortable: true,
    },
    {
        name: 'Progression or Recurrence Type',
        selector: 'ProgressionorRecurrenceType',
        sortable: true,
    },

    {
        name: 'Days to Last Followup',
        selector: 'DaystoLastFollowup',
        sortable: true,
    },

    {
        name: 'Days to Last Known Disease Status',
        selector: 'DaystoLastKnownDiseaseStatus',
        sortable: true,
    },

    {
        name: 'Ethnicity',
        selector: 'Ethnicity',
        sortable: true,
    },
    {
        name: 'Gender',
        selector: 'Gender',
        sortable: true,
    },
    {
        name: 'Race',
        selector: 'Race',
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

export const CaseTable: React.FunctionComponent<ICaseTableProps> = (props) => {
    // const generatedColumns = generateColumnsForDataSchema(
    //     [
    //         SchemaDataId.Diagnosis,
    //         SchemaDataId.Demographics,
    //         SchemaDataId.Therapy,
    //     ],
    //     props.schemaDataById,
    //     props.genericAttributeMap,
    //     // need to add a custom sort function for the id
    //     {
    //         [GenericAttributeNames.ParticipantID]: {
    //             sortFunction: sortByParticipantId,
    //         },
    //         AgeatDiagnosis: {
    //             // we need to customize both the name and the tooltip since we convert days to years
    //             name: 'Age at Diagnosis (years)',
    //             headerTooltip:
    //                 'Age at the time of diagnosis expressed in number of years since birth.',
    //             format: (sample: Entity) =>
    //                 convertAgeInDaysToYears(sample.AgeatDiagnosis),
    //             cell: (sample: Entity) => (
    //                 <span className="ml-auto">
    //                     {convertAgeInDaysToYears(sample.AgeatDiagnosis)}
    //                 </span>
    //             ),
    //         },
    //         TreatmentType: {
    //             omit: false,
    //         },
    //     },
    //     // Component seems to be always "Diagnosis", no need to have a column for it
    //     ['Component', ...(props.excludedColumns ? props.excludedColumns : [])]
    // );

    // we need to add ancestry columns manually because they are attached externally and not part of any schema
    const customColumns = ['AFR', 'AMR', 'EAS', 'EUR', 'SAS'].map((name) => ({
        id: name,
        selector: name,
        omit: true,
        wrap: true,
        sortable: true,
        searchable: false,
        cell: (sample: Entity) => {
            const value = Number(sample[name as keyof Entity]);

            if (value === 0 || _.isNaN(value)) {
                return undefined;
            } else if (value < 0.001) {
                return value.toExponential(4);
            } else {
                return value.toFixed(6);
            }
        },
        name: `${name} Genomic Ancestry`,
    }));

    const columns = [
        ...cols.slice(0, 2),
        getPublicationColumn(props.publicationsByUid),
        ...cols.slice(2),
        ...customColumns,
    ];

    return (
        <EnhancedDataTable
            columns={columns}
            defaultSortField={GenericAttributeNames.ParticipantID}
            data={props.cases}
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

export default CaseTable;
