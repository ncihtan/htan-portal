import {
    AttributeNames,
    GenericAttributeNames,
    IAttributeInfo,
} from '@htan/data-portal-utils';
import {
    Atlas,
    Entity,
    PublicationManifest,
    SerializableEntity,
} from './entity';
import {
    getCaseValues,
    getNormalizedOrganCaseValues,
    getNormalizedTreatmentTypeValues,
} from './getCaseValues';
import { getViewerValues } from './getViewerValues';

export enum HTANAttributeNames {
    HTANParentID = 'HTANParentID',
    HTANBiospecimenID = 'HTANBiospecimenID',
    HTANDataFileID = 'HTANDataFileID',
    HTANParticipantID = 'HTANParticipantID',
    HTANParentBiospecimenID = 'HTANParentBiospecimenID',
    HTANParentDataFileID = 'HTANParentDataFileID',
    AccessoryAssociatedHTANParentDataFileID = 'Accessory-associatedHTANParentDataFileID',
    PublicationAssociatedHTANParentDataFileID = 'Publication-associatedHTANParentDataFileID',
    HTANGrantID = 'HTANGrantID',
    HTANCenterID = 'HTANCenterID',
    PublicationContainsHTANID = 'PublicationcontainsHTANID',
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
    [HTANAttributeNames.AccessoryAssociatedHTANParentDataFileID]:
        GenericAttributeNames.AccessoryAssociatedParentDataFileID,
    [HTANAttributeNames.PublicationAssociatedHTANParentDataFileID]:
        GenericAttributeNames.PublicationAssociatedParentDataFileID,
    [HTANAttributeNames.HTANGrantID]: GenericAttributeNames.GrantID,
    [HTANAttributeNames.HTANCenterID]: GenericAttributeNames.CenterID,
    [HTANAttributeNames.PublicationContainsHTANID]:
        GenericAttributeNames.PublicationContainsID,
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
    [AttributeNames.publicationIds]: {
        path: 'publicationIds',
        displayName: 'Publication',
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
    [AttributeNames.TreatmentType]: {
        displayName: 'Treatment',
        getValues: getNormalizedTreatmentTypeValues,
        caseFilter: true,
    },
};

export interface LoadDataResult {
    files: SerializableEntity[];
    atlases: Atlas[];
    publicationManifestByUid: {
        [uid: string]: PublicationManifest;
    };
    biospecimenByBiospecimenID: {
        [BiospecimenID: string]: SerializableEntity;
    };
    diagnosisByParticipantID: {
        [ParticipantID: string]: SerializableEntity;
    };
    demographicsByParticipantID: {
        [ParticipantID: string]: SerializableEntity;
    };
    therapyByParticipantID: { [ParticipantID: string]: SerializableEntity };
}

export interface GeneralLink {
    name: string;
    link: string;
}
