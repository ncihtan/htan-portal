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
    publicationIds?: string[];
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
    name: string;
    entityId?: string;
    HTAN_Data_File_ID: string;
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

export interface PublicationManifest {
    PublicationAssociatedParentDataFileID: string;
    GrantID: string;
    CenterID: string;
    PublicationContentType: string;
    DOI: string;
    Title: string;
    Authors: string;
    CorrespondingAuthor: string;
    CorrespondingAuthorORCID: string;
    YearofPublication: number;
    LocationofPublication: string;
    PublicationAbstract: string;
    License?: string;
    PMID: string;
    PublicationContainsID: string;
    DataType: string;
    Tool: string;
    SupportingLink?: string;
    SupportingLinkDescription?: string;

    // Derived or attached in frontend
    atlasid: string;
    atlas_name: string;
    assayName?: string;
    AtlasMeta: AtlasMeta;
    synapseId?: string;
}

export interface PublicationSummary {
    uid: string;
    pubdate: string;
    epubdate: string;
    source: string;
    authors: {
        name: string;
        authtype: string;
        clusterid: string;
    }[];
    lastauthor: string;
    title: string;
    sorttitle: string;
    volume: string;
    issue: string;
    pages: string;
    lang: string[];
    nlmuniqueid: string;
    issn: string;
    essn: string;
    pubtype: string[];
    recordstatus: string;
    pubstatus: string;
    articleids: {
        idtype: string;
        idtypen: number;
        value: string;
    }[];
    history: {
        pubstatus: string;
        date: string;
    }[];
    references: {
        refsource: string;
        reftype: string;
        pmid: string;
        note: string;
    }[];
    attributes: string[];
    pmcrefcount: number;
    fulljournalname: string;
    elocationid: string;
    doctype: string;
    booktitle: string;
    medium: string;
    edition: string;
    publisherlocation: string;
    publishername: string;
    srcdate: string;
    reportnumber: string;
    availablefromurl: string;
    locationlabel: string;
    docdate: string;
    bookname: string;
    chapter: string;
    sortpubdate: string;
    sortfirstauthor: string;
    vernaculartitle: string;
}

export interface AccessoryManifest {
    DatasetName: string;
    AccessorySynapseID: string;
    AccessoryDescription: string;
    DataType: string;
    CenterID: string;
    ParentBiospecimenID: string;
    AccessoryAssociatedParentDataFileID: string;
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
