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
    imageChannelMetadata?: ImageChannelMetadata;
    viewers?: FileViewers;
    releaseVersion?: string;
}

export enum FileViewerName {
    autoMinerva = 'autoMinerva',
    idc = 'idc',
    cds = 'cds',
    customMinerva = 'customMinerva',
    ucscXena = 'ucscXena',
    cellxgene = 'cellxgene',
    isbcgc = 'isbcgc',
}

export interface FileViewers {
    [FileViewerName.autoMinerva]?: AutoMinerva;
    [FileViewerName.idc]?: IdcImagingAsset;
    [FileViewerName.cds]?: CdsAsset;
    [FileViewerName.customMinerva]?: string;
    [FileViewerName.ucscXena]?: string;
    [FileViewerName.cellxgene]?: string;
    [FileViewerName.isbcgc]?: string;
}

export interface AutoMinerva {
    synid: string;
    minerva?: string;
    thumbnail?: string;
}

export interface IdcImagingAsset {
    collection_id: string;
    ContainerIdentifier: string;
    s5cmd_manifest_gcp: string;
    s5cmd_manifest_aws: string;
    viewer_url: string;
}

export interface CdsAsset {
    file_name: string;
    file_size: string;
    HTAN_Data_File_ID: string;
    guid: string;
    drs_uri: string;
}

export interface ImageChannelMetadata {
    version: number;
    synapseId: string;
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

export type Atlas = {
    htan_id: string;
    htan_name: string;
    num_cases: number;
    num_biospecimens: number;
    AtlasMeta: AtlasMeta;
};

export interface AtlasMetaData {
    [atlasId: string]: {
        component: string;
        synapseId: string;
        numItems: number;
    }[];
}

export interface ReleaseEntity {
    entityId: string;
    Data_Release: string;
    Id: string;
    type: string;
    CDS_Release: string;
    IDC_Release: string;
    Component: string;
    channel_metadata_version: string;
    channel_metadata_synapseId: string;
}
