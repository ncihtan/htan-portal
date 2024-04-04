import {
    AttributeNames,
    GenericAttributeNames,
    IAttributeInfo,
} from '@htan/data-portal-utils';
import { Atlas, Entity, SerializableEntity } from './entity';
import { getCaseValues, getNormalizedOrganCaseValues } from './getCaseValues';
import { getViewerValues } from './getViewerValues';

export enum HTANAttributeNames {
    HTANParentID = 'HTANParentID',
    HTANBiospecimenID = 'HTANBiospecimenID',
    HTANDataFileID = 'HTANDataFileID',
    HTANParticipantID = 'HTANParticipantID',
    HTANParentBiospecimenID = 'HTANParentBiospecimenID',
    HTANParentDataFileID = 'HTANParentDataFileID',
}

export const HTANToGenericAttributeMap: {
    [attr in HTANAttributeNames]: GenericAttributeNames;
} = {
    [HTANAttributeNames.HTANParentID]: GenericAttributeNames.ParentID,
    [HTANAttributeNames.HTANBiospecimenID]: GenericAttributeNames.BiospecimenID,
    [HTANAttributeNames.HTANDataFileID]: GenericAttributeNames.DataFileID,
    [HTANAttributeNames.HTANParticipantID]: GenericAttributeNames.ParticipantID,
    [HTANAttributeNames.HTANParentBiospecimenID]:
        GenericAttributeNames.ParentBiospecimenID,
    [HTANAttributeNames.HTANParentDataFileID]:
        GenericAttributeNames.ParentDataFileID,
};

export const FileAttributeMap: {
    [attr in AttributeNames]: IAttributeInfo<Entity>;
} = {
    [AttributeNames.organType]: {
        getValues: getNormalizedOrganCaseValues,
        displayName: 'Organ',
        caseFilter: true,
    },
    [AttributeNames.TissueorOrganofOrigin]: {
        getValues: getCaseValues('TissueorOrganofOrigin'),
        displayName: 'Organ Detailed',
        caseFilter: true,
    },
    [AttributeNames.PrimaryDiagnosis]: {
        getValues: getCaseValues('PrimaryDiagnosis'),
        displayName: 'Disease',
        caseFilter: true,
    },
    [AttributeNames.Race]: {
        getValues: getCaseValues('Race'),
        displayName: 'Race',
        caseFilter: true,
    },
    [AttributeNames.Ethnicity]: {
        getValues: getCaseValues('Ethnicity'),
        displayName: 'Ethnicity',
        caseFilter: true,
    },
    [AttributeNames.CountryofResidence]: {
        getValues: getCaseValues('CountryofResidence'),
        displayName: 'Country of Residence',
        caseFilter: true,
    },
    [AttributeNames.Gender]: {
        getValues: getCaseValues('Gender'),
        displayName: 'Gender',
        caseFilter: true,
    },
    [AttributeNames.Component]: {
        path: 'Component',
        displayName: 'Assay',
    },
    [AttributeNames.Biospecimen]: {
        path: 'Biospecimen',
        displayName: 'Biospecimen',
    },
    [AttributeNames.AtlasName]: {
        path: 'atlas_name',
        displayName: 'Atlas',
    },
    [AttributeNames.Stage]: {
        getValues: getCaseValues('AJCCPathologicStage'),
        displayName: 'Stage',
        caseFilter: true,
    },
    [AttributeNames.Level]: {
        path: 'level',
        displayName: 'Level',
    },
    [AttributeNames.FileFormat]: {
        path: 'FileFormat',
        displayName: 'File Format',
    },
    [AttributeNames.assayName]: {
        path: 'assayName',
        displayName: 'Assay',
    },
    [AttributeNames.downloadSource]: {
        path: 'downloadSource',
        displayName: 'Data Access',
    },
    [AttributeNames.viewers]: {
        getValues: getViewerValues,
        displayName: 'Viewer',
    },
    [AttributeNames.releaseVersion]: {
        path: 'releaseVersion',
        displayName: 'Release',
    },
};

export interface LoadDataResult {
    files: SerializableEntity[];
    atlases: Atlas[];
    biospecimenByBiospecimenID: {
        [BiospecimenID: string]: SerializableEntity;
    };
    diagnosisByParticipantID: {
        [ParticipantID: string]: SerializableEntity;
    };
    demographicsByParticipantID: {
        [ParticipantID: string]: SerializableEntity;
    };
}
