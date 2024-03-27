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
    Level = 'Level',
    FileFormat = 'FileFormat',

    // Derived or attached in frontend
    organType = 'organType',
    assayName = 'assayName',
    downloadSource = 'downloadSource',
    releaseVersion = 'releaseVersion',
    viewers = 'viewers',
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
    CenterID = 'CenterID',
}

export type AttributeMap<T, Attribute extends string> = {
    [attr in Attribute]: IAttributeInfo<T>;
};
