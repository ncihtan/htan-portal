export interface IAttributeInfo<T> {
    path?: string;
    getValues?: (e: T) => string[];
    displayName: string;
    caseFilter?: boolean;
}

export enum AttributeNames {
    // Synapse attribute names
    TissueorOrganofOrigin = 'TissueorOrganofOrigin',
    PrimaryDiagnosis = 'PrimaryDiagnosis',
    Gender = 'Gender',
    Race = 'Race',
    Ethnicity = 'Ethnicity',
    CountryofResidence = 'CountryofResidence',
    Component = 'Component',
    Biospecimen = 'Biospecimen',
    AtlasName = 'AtlasName',
    Stage = 'Stage',
    level = 'level',
    FileFormat = 'FileFormat',
    TreatmentType = 'TreatmentType',

    // Derived or attached in frontend
    organType = 'organType',
    assayName = 'assayName',
    publicationIds = 'publicationIds',
    downloadSource = 'downloadSource',
    viewersArr = 'viewersArr',
    releaseVersion = 'releaseVersion',
}

// Normalized/Generic attribute names
export enum GenericAttributeNames {
    ParentID = 'ParentID',
    BiospecimenID = 'BiospecimenID',
    DataFileID = 'DataFileID',
    ParticipantID = 'ParticipantID',
    ParentBiospecimenID = 'ParentBiospecimenID',
    ParentDataFileID = 'ParentDataFileID',
    AccessoryAssociatedParentDataFileID = 'AccessoryAssociatedParentDataFileID',
    PublicationAssociatedParentDataFileID = 'PublicationAssociatedParentDataFileID',
    GrantID = 'GrantID',
    CenterID = 'CenterID',
    PublicationContainsID = 'PublicationContainsID',
}

export type AttributeMap<T, Attribute extends string> = {
    [attr in Attribute]: IAttributeInfo<T>;
};
