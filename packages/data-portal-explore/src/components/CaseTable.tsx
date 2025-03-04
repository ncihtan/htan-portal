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
    generateColumnsForDataSchema,
    getAtlasColumn,
    getPublicationColumn,
    sortByParticipantId,
} from '../lib/dataTableHelpers';
import { DataSchemaData, SchemaDataId } from '@htan/data-portal-schema';
import { commonColumns } from './columns.tsx';

interface ICaseTableProps {
    cases: Entity[];
    synapseAtlases: Atlas[];
    schemaDataById?: { [schemaDataId: string]: DataSchemaData };
    excludedColumns?: string[];
    genericAttributeMap?: { [attr: string]: GenericAttributeNames };
    publicationsByUid?: { [uid: string]: PublicationManifest };
}

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
    {
        name: 'VitalStatus',
        selector: 'VitalStatus',
        sortable: true,
        omit: true,
    },
    {
        name: 'DaystoBirth',
        selector: 'DaystoBirth',
        sortable: true,
        omit: true,
    },
    {
        name: 'CountryofResidence',
        selector: 'CountryofResidence',
        sortable: true,
        omit: true,
    },
    {
        name: 'AgeIsObfuscated',
        selector: 'AgeIsObfuscated',
        sortable: true,
        omit: true,
    },
    {
        name: 'YearOfBirth',
        selector: 'YearOfBirth',
        sortable: true,
        omit: true,
    },
    {
        name: 'Occupation Duration Years',
        selector: 'OccupationDurationYears',
        sortable: true,
        omit: true,
    },
    {
        name: 'Premature At Birth',
        selector: 'PrematureAtBirth',
        sortable: true,
        omit: true,
    },
    {
        name: 'Weeks Gestationat Birth',
        selector: 'WeeksGestationatBirth',
        sortable: true,
        omit: true,
    },
    {
        name: 'Cause of Death',
        selector: 'CauseofDeath',
        sortable: true,
    },
    {
        name: 'Cause of Death Source',
        selector: 'CauseofDeathSource',
        sortable: true,
        omit: true,
    },
    {
        name: 'Days to Death',
        selector: 'DaystoDeath',
        sortable: true,
        omit: true,
    },
    {
        name: 'Year of Death',
        selector: 'YearofDeath',
        sortable: true,
        omit: true,
    },
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
            const value = sample[name as keyof Entity] as number;

            if (value === undefined) {
                return value;
            } else if (value < 0.001) {
                return value.toExponential(4);
            } else {
                return value.toFixed(6);
            }
        },
        name: `${name} Genomic Ancestry`,
    }));

    const columns = [...cols, ...customColumns];

    columns.splice(2, 0, getPublicationColumn(props.publicationsByUid));

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
