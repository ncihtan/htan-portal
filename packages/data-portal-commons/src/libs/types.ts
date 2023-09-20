import {
    AttributeNames,
    GenericAttributeNames,
    IAttributeInfo,
} from '../../../data-portal-utils/src/libs/types';
import { getCaseValues } from './getCaseValues';
import { Entity } from './entity';

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
    [AttributeNames.TissueorOrganofOrigin]: {
        getValues: getCaseValues('TissueorOrganofOrigin'),
        displayName: 'Organ',
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
    [AttributeNames.releaseVersion]: {
        path: 'releaseVersion',
        displayName: 'Release',
    },
};
