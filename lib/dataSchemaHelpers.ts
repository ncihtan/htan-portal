// content copied (and adapted) from https://github.com/Sage-Bionetworks/Synapse-React-Client
import _ from 'lodash';
import fetch from 'node-fetch';

// import * as defaultSchema from '../data/schema.json'

export interface BaseEntity {
    '@id': string;
}

export interface SchemaContext {
    [key: string]: string;
}

export interface SchemaData extends BaseEntity {
    '@type': string[] | string;
    'rdfs:comment'?: string | null;
    'rdfs:label': string;
    'rdfs:subClassOf'?: BaseEntity | BaseEntity[];
    'sms:displayName'?: string;
    'sms:required'?: string;
    'sms:validationRules'?: string[];
    'sms:requiresDependency'?: BaseEntity[];
    'schema:rangeIncludes'?: BaseEntity | BaseEntity[];
    'schema:domainIncludes'?: BaseEntity | BaseEntity[];
    'sms:requiresComponent'?: BaseEntity | BaseEntity[];
}

export interface DataSchemaData {
    //@id
    id: string;

    //@type
    type: string[];

    //rdfs:label
    label: string;

    //rdfs:comment
    description: string;

    //sms:displayName [note: substitute label if not present]
    attribute: string;

    //rdfs:subClassOf [note: source can be object or array]
    parentIds: string[];

    //sms:required
    required: boolean;

    //sms:requiresDependency
    requiredDependencies: string[];

    // Built from the context and the id.
    source: string;

    //sms:validationRules
    validationRules: string[];

    //schema:rangeIncludes [note: source can be object or array]
    validValues: string[];

    //schema:requiresComponent [note: source can be object or array]
    requiresComponent: string[];

    //schema:domainIncludes [note: source can be object or array]
    domainIncludes: string[];
}

export interface SchemaJson extends BaseEntity {
    '@context': SchemaContext;
    '@graph': SchemaData[];
}

export enum SchemaDataId {
    Biospecimen = 'bts:Biospecimen',
    BulkRNASeqLevel1 = 'bts:BulkRNA-seqLevel1',
    BulkRNASeqLevel2 = 'bts:BulkRNA-seqLevel2',
    BulkRNASeqLevel3 = 'bts:BulkRNA-seqLevel3',
    BulkWESLevel1 = 'bts:BulkWESLevel1',
    BulkWESLevel2 = 'bts:BulkWESLevel2',
    BulkWESLevel3 = 'bts:BulkWESLevel3',
    ClinicalDataTier2 = 'bts:ClinicalDataTier2',
    Demographics = 'bts:Demographics',
    Diagnosis = 'bts:Diagnosis',
    Exposure = 'bts:Exposure',
    FamilyHistory = 'bts:FamilyHistory',
    FollowUp = 'bts:FollowUp',
    Imaging = 'bts:Imaging',
    ImagingLevel2 = 'bts:ImagingLevel2',
    MolecularTest = 'bts:MolecularTest',
    scATACSeqLevel1 = 'bts:ScATAC-seqLevel1',
    scRNASeqLevel1 = 'bts:ScRNA-seqLevel1',
    scRNASeqLevel2 = 'bts:ScRNA-seqLevel2',
    scRNASeqLevel3 = 'bts:ScRNA-seqLevel3',
    scRNASeqLevel4 = 'bts:ScRNA-seqLevel4',
    Therapy = 'bts:Therapy',
    AcuteLymphoblasticLeukemiaTier3 = 'bts:AcuteLymphoblasticLeukemiaTier3',
    BrainCancerTier3 = 'bts:BrainCancerTier3',
    BreastCancerTier3 = 'bts:BreastCancerTier3',
    ColorectalCancerTier3 = 'bts:ColorectalCancerTier3',
    LungCancerTier3 = 'bts:LungCancerTier3',
    MelanomaTier3 = 'bts:MelanomaTier3',
    OvarianCancerTier3 = 'bts:OvarianCancerTier3',
    PancreaticCancerTier3 = 'bts:PancreaticCancerTier3',
    ProstateCancerTier3 = 'bts:ProstateCancerTier3',
    SarcomaTier3 = 'bts:SarcomaTier3',

    AgeAtDiagnosis = 'bts:AgeatDiagnosis',
    YearOfDiagnosis = 'bts:YearofDiagnosis',
    DaysToLastFollowup = 'bts:DaystoLastFollowup',
    DaysToLastKnownDiseaseStatus = 'bts:DaystoLastKnownDiseaseStatus',
    DaysToDiagnosis = 'bts:DaystoDiagnosis',
    PercentTumorInvasion = 'bts:PercentTumorInvasion',
    GrossTumorWeight = 'bts:GrossTumorWeight',
    BreslowThickness = 'bts:BreslowThickness',
    MitoticCount = 'bts:MitoticCount',
    MarginDistance = 'bts:MarginDistance',
    TumorDepth = 'bts:TumorDepth',
    DaysToBirth = 'bts:DaystoBirth',

    CollectionDaysfromIndex = 'bts:CollectionDaysfromIndex',
    ProcessingDaysfromIndex = 'bts:ProcessingDaysfromIndex',
    DysplasiaFraction = 'bts:DysplasiaFraction',
    NumberProliferatingCells = 'bts:NumberProliferatingCells',
    PercentEosinophilInfiltration = 'bts:PercentEosinophilInfiltration',
    PercentGranulocyteInfiltration = 'bts:PercentGranulocyteInfiltration',
    PercentInflamInfiltration = 'bts:PercentInflamInfiltration',
    PercentLymphocyteInfiltration = 'bts:PercentLymphocyteInfiltration',
    PercentMonocyteInfiltration = 'bts:PercentMonocyteInfiltration',
    PercentNecrosis = 'bts:PercentNecrosis',
    PercentNeutrophilInfiltration = 'bts:PercentNeutrophilInfiltration',
    PercentNormalCells = 'bts:PercentNormalCells',
    PercentStromalCells = 'bts:PercentStromalCells',
    PercentTumorCells = 'bts:PercentTumorCells',
    PercentTumorNuclei = 'bts:PercentTumorNuclei',
}

const NUMERICAL_SCHEMA_DATA_LOOKUP: { [schemaDataId: string]: boolean } = {
    [SchemaDataId.AgeAtDiagnosis]: true,
    [SchemaDataId.YearOfDiagnosis]: true,
    [SchemaDataId.DaysToLastFollowup]: true,
    [SchemaDataId.DaysToLastKnownDiseaseStatus]: true,
    [SchemaDataId.DaysToDiagnosis]: true,
    [SchemaDataId.PercentTumorInvasion]: true,
    [SchemaDataId.GrossTumorWeight]: true,
    [SchemaDataId.BreslowThickness]: true,
    [SchemaDataId.MitoticCount]: true,
    [SchemaDataId.MarginDistance]: true,
    [SchemaDataId.TumorDepth]: true,
    [SchemaDataId.DaysToBirth]: true,
    [SchemaDataId.CollectionDaysfromIndex]: true,
    [SchemaDataId.ProcessingDaysfromIndex]: true,
    [SchemaDataId.DysplasiaFraction]: true,
    [SchemaDataId.NumberProliferatingCells]: true,
    [SchemaDataId.PercentEosinophilInfiltration]: true,
    [SchemaDataId.PercentGranulocyteInfiltration]: true,
    [SchemaDataId.PercentInflamInfiltration]: true,
    [SchemaDataId.PercentLymphocyteInfiltration]: true,
    [SchemaDataId.PercentMonocyteInfiltration]: true,
    [SchemaDataId.PercentNecrosis]: true,
    [SchemaDataId.PercentNeutrophilInfiltration]: true,
    [SchemaDataId.PercentNormalCells]: true,
    [SchemaDataId.PercentStromalCells]: true,
    [SchemaDataId.PercentTumorCells]: true,
    [SchemaDataId.PercentTumorNuclei]: true,
};

export const DEFAULT_SCHEMA: SchemaJson = {
    '@context': {},
    '@graph': [],
    '@id': '',
};

export const DEFAULT_SCHEMA_URL =
    'https://raw.githubusercontent.com/ncihtan/schematic/main/data/schema_org_schemas/HTAN.jsonld';

const schemaDataCache: { [uri: string]: SchemaJson } = {};

export function getDataSchemaDependencies(
    schema: DataSchemaData,
    schemaDataById: { [schemaDataId: string]: DataSchemaData } = {}
): DataSchemaData[] {
    return _.compact(
        schema.requiredDependencies.map((id) => schemaDataById[id])
    );
}

export function getDataSchemaParents(
    schema: DataSchemaData,
    schemaDataById: { [schemaDataId: string]: DataSchemaData } = {}
): DataSchemaData[] {
    return _.compact(schema.parentIds.map((id) => schemaDataById[id]));
}

export function getDataSchemaValidValues(
    schema: DataSchemaData,
    schemaDataById: { [schemaDataId: string]: DataSchemaData } = {}
): DataSchemaData[] {
    return _.compact(schema.validValues.map((id) => schemaDataById[id]));
}

export function hasNonEmptyValidValues(schemaData: DataSchemaData[]): boolean {
    return !_.isEmpty(_.flatten(schemaData.map((s) => s.validValues)));
}

export async function getDataSchema(
    ids: SchemaDataId[],
    dataUri: string = DEFAULT_SCHEMA_URL
): Promise<{
    dataSchemaData: DataSchemaData[];
    schemaDataById: { [schemaDataId: string]: DataSchemaData };
}> {
    const schemaDataById = await getSchemaDataMap(dataUri);
    const dataSchemaData = _.compact(ids.map((id) => schemaDataById[id]));

    return { dataSchemaData, schemaDataById };
}

export async function getSchemaDataMap(
    dataUri: string = DEFAULT_SCHEMA_URL
): Promise<{ [schemaDataId: string]: DataSchemaData }> {
    const schemaData = getDataSchemaData(await getSchemaData(dataUri));
    return _.keyBy(schemaData, (d) => d.id);
}

export async function getSchemaData(dataUri?: string): Promise<SchemaJson> {
    if (!dataUri) {
        // return {
        //     '@context': defaultSchema['@context'],
        //     '@graph': defaultSchema['@graph'],
        //     '@id': defaultSchema['@id'],
        // } as SchemaJson;

        return DEFAULT_SCHEMA;
    }

    // do not fetch again if fetched before
    if (schemaDataCache[dataUri]) {
        return schemaDataCache[dataUri];
    }

    try {
        // https://raw.githubusercontent.com/Sage-Bionetworks/schematic/main/data/schema_org_schemas/example.jsonld
        // https://github.com/ncihtan/hsim/blob/master/schema/HTAN.jsonld
        const res = await fetch(dataUri);

        // const json = await res.json();
        const text = await res.text();
        const json = JSON.parse(text);

        // cache the schema data
        schemaDataCache[dataUri] = json;

        return json;
    } catch {
        // console.error(`Invalid Url: ${dataUri}`);
        return DEFAULT_SCHEMA;
    }
}

export function getDataSchemaData(schemaJson?: SchemaJson): DataSchemaData[] {
    const schema: SchemaData[] = schemaJson ? schemaJson['@graph'] || [] : [];
    const context: SchemaContext = schemaJson
        ? schemaJson['@context'] || {}
        : {};

    if (schema.length > 0) {
        return schema.map(mapSchemaDataToDataSchemaData(context));
    }

    return [] as DataSchemaData[];
}

export function mapSchemaDataToDataSchemaData(
    context: SchemaContext
): (nd: SchemaData) => DataSchemaData {
    return function (nd: SchemaData): DataSchemaData {
        const parentIds: string[] = (normalizeEntity(
            nd['rdfs:subClassOf']
        ) as BaseEntity[]).map((rd: BaseEntity): string => rd['@id']);

        const pieces: string[] = nd['@id'].split(`:`);
        const source: string = `${context[pieces[0]]}${pieces[1]}`;

        const type: string[] = (normalizeEntity(nd['@type']) as string[]).map(
            (rd: string): string => rd
        );

        const requiredDependencies: string[] = (normalizeEntity(
            nd['sms:requiresDependency']
        ) as BaseEntity[]).map((rd: BaseEntity): string => rd['@id']);

        const validValues: string[] = (normalizeEntity(
            nd['schema:rangeIncludes']
        ) as BaseEntity[]).map((rd: BaseEntity): string => rd['@id']);

        const requiresComponent: string[] = (normalizeEntity(
            nd['sms:requiresComponent']
        ) as BaseEntity[]).map((rd: BaseEntity): string => rd['@id']);

        const domainIncludes: string[] = (normalizeEntity(
            nd['schema:domainIncludes']
        ) as BaseEntity[]).map((rd: BaseEntity): string => rd['@id']);

        return {
            id: nd['@id'],
            type,
            description: nd['rdfs:comment'] || ``,
            label: nd['rdfs:label'],
            parentIds,
            attribute: nd['sms:displayName'] || ``,
            required: nd?.['sms:required'] === 'sms:true' || false,
            requiredDependencies,
            validationRules: nd['sms:validationRules'] || [],
            validValues,
            domainIncludes,
            requiresComponent,
            source,
        } as DataSchemaData;
    };
}

export function isNumericalSchemaData(schemaData: DataSchemaData) {
    // TODO ideally DataSchemaData should have the data type information (integer, string, etc.) for a specific field
    //  for now we need to use a manually defined lookup
    return NUMERICAL_SCHEMA_DATA_LOOKUP[schemaData.id] || false;
}

function normalizeEntity(
    entity: string | string[] | BaseEntity | BaseEntity[] | undefined
): (string | BaseEntity)[] {
    return !entity ? [] : !Array.isArray(entity) ? Array(entity) : entity;
}
