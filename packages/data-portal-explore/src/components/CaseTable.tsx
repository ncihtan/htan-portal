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
        selector: 'HTANParticipantID',
    },

    {
        name: 'Atlas Name',
        selector: 'atlas_name',
    },
    commonColumns.AgeatDiagnosis,
    {
        name: 'Primary Diagnosis',
        selector: 'PrimaryDiagnosis',
    },
    {
        name: 'Site of Resection or Biopsy',
        selector: 'SiteofResectionorBiopsy',
    },
    {
        name: 'Tissue or Organ of Origin',
        selector: 'TissueorOrganofOrigin',
    },
    {
        name: 'Morphology',
        selector: 'Morphology',
    },

    {
        name: 'Progression or Recurrence Type',
        selector: 'ProgressionorRecurrenceType',
    },

    {
        name: 'Last Known Disease Status',
        selector: 'LastKnownDiseaseStatus',
    },

    {
        name: 'Progression or Recurrence Type',
        selector: 'ProgressionorRecurrenceType',
    },

    {
        name: 'Days to Last Followup',
        selector: 'DaystoLastFollowup',
    },

    {
        name: 'Days to Last Known Disease Status',
        selector: 'DaystoLastKnownDiseaseStatus',
    },

    {
        name: 'Ethnicity',
        selector: 'Ethnicity',
    },
    {
        name: 'Gender',
        selector: 'Gender',
    },
    {
        name: 'Race',
        selector: 'Race',
    },
    {
        name: 'VitalStatus',
        selector: 'VitalStatus',
    },
    {
        name: 'DaystoBirth',
        selector: 'DaystoBirth',
    },
    {
        name: 'CountryofResidence',
        selector: 'CountryofResidence',
    },
    {
        name: 'AgeIsObfuscated',
        selector: 'AgeIsObfuscated',
    },
    {
        name: 'YearOfBirth',
        selector: 'YearOfBirth',
    },
    {
        name: 'Occupation Duration Years',
        selector: 'OccupationDurationYears',
    },
    {
        name: 'Premature At Birth',
        selector: 'PrematureAtBirth',
    },
    {
        name: 'Weeks Gestationat Birth',
        selector: 'WeeksGestationatBirth',
    },
    {
        name: 'Cause of Death',
        selector: 'CauseofDeath',
    },
    {
        name: 'Cause of Death Source',
        selector: 'CauseofDeathSource',
    },
    {
        name: 'Days to Death',
        selector: 'DaystoDeath',
    },
    {
        name: 'Year of Death',
        selector: 'YearofDeath',
    },
    // {
    //     "name": "atlasid",
    //     "selector": "atlasid"
    // },

    {
        name: 'assayName',
        selector: 'assayName',
    },
    {
        name: 'AtlasMeta',
        selector: 'AtlasMeta',
    },
    {
        name: 'publicationIds',
        selector: 'publicationIds',
    },
];

export const CaseTable: React.FunctionComponent<ICaseTableProps> = (props) => {
    const generatedColumns = generateColumnsForDataSchema(
        [
            SchemaDataId.Diagnosis,
            SchemaDataId.Demographics,
            SchemaDataId.Therapy,
        ],
        props.schemaDataById,
        props.genericAttributeMap,
        // need to add a custom sort function for the id
        {
            [GenericAttributeNames.ParticipantID]: {
                sortFunction: sortByParticipantId,
            },
            AgeatDiagnosis: {
                // we need to customize both the name and the tooltip since we convert days to years
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
            },
            TreatmentType: {
                omit: false,
            },
        },
        // Component seems to be always "Diagnosis", no need to have a column for it
        ['Component', ...(props.excludedColumns ? props.excludedColumns : [])]
    );

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

    const columns = [...customColumns, ...cols];

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
