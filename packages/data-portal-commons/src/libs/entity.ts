// Entity links in some referenced objects, which will help
//  for search/filter efficiency, and adds `cases` member.

export interface Entity extends SerializableEntity {
    biospecimen: Entity[];
    diagnosis: Entity[];
    demographics: Entity[];
    cases: Entity[];
}

export interface SerializableEntity extends BaseSerializableEntity {
    biospecimenIds: BiospecimenID[];
    diagnosisIds: ParticipantID[];
    demographicsIds: ParticipantID[];
}

export type DataFileID = string;
export type BiospecimenID = string;
export type ParticipantID = string;

export interface BaseSerializableEntity {
    // Synapse attribute names
    AJCCPathologicStage: string;
    Biospecimen: string;
    Component: string;
    ParentID: string;
    BiospecimenID: string;
    DataFileID: DataFileID; // this is used as the stable UID
    ParentBiospecimenID: string;
    ParentDataFileID: string;
    TissueorOrganofOrigin: string;
    PrimaryDiagnosis: string;
    AgeatDiagnosis: number;
    FileFormat: string;
    Filename: string;
    ParticipantID: string;
    ImagingAssayType?: string;
    AssayType?: string;
    Race: string;
    Ethnicity: string;
    CountryofResidence: string;
    Gender: string;
    Islowestlevel?: string;

    // Derived or attached in frontend
    atlasid: string;
    atlas_name: string;
    level: string;
    assayName?: string;
    AtlasMeta: AtlasMeta;
    primaryParents?: DataFileID[];
    synapseId?: string;
    isRawSequencing?: boolean;
    downloadSource?: DownloadSourceCategory;
    releaseVersion?: string;
}

export enum DownloadSourceCategory {
    dbgap = 'dbGaP',
    // idc = 'IDC',
    cds = 'CDS/SB-CGC (open access)',
    synapse = 'Synapse',
    comingSoon = 'Coming Soon',
}

export interface AtlasMeta {
    title: { rendered: string };
    lead_institutions: string;
    htan_id: string;
    short_description?: string;
}
