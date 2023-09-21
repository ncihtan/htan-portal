// content copied (and adapted) from https://github.com/Sage-Bionetworks/Synapse-React-Client
import _ from 'lodash';
import fetch from 'node-fetch';
import { getLatestReleaseSchemaUrl } from './vcsHelpers';

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

    // Built by traversing the entire schema and resolving the parent ids
    conditionalDependencies: string[];

    // Conditional dependencies not listed anywhere else as a required dependency
    exclusiveConditionalDependencies: string[];

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

export interface SchemaDataById {
    [schemaDataId: string]: DataSchemaData;
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
    ImagingLevel1 = 'bts:ImagingLevel1',
    ImagingLevel2 = 'bts:ImagingLevel2',
    ImagingLevel3 = 'bts:ImagingLevel3Segmentation',
    ImagingLevel4 = 'bts:ImagingLevel4',
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

    VisiumSpatialTranscriptomicsRNASeqLevel1 = 'bts:10xVisiumSpatialTranscriptomics-RNA-seqLevel1',
    VisiumSpatialTranscriptomicsRNASeqLevel2 = 'bts:10xVisiumSpatialTranscriptomics-RNA-seqLevel2',
    VisiumSpatialTranscriptomicsRNASeqLevel3 = 'bts:10xVisiumSpatialTranscriptomics-RNA-seqLevel3',
    VisiumSpatialTranscriptomicsAuxiliaryFiles = 'bts:10xVisiumSpatialTranscriptomics-AuxiliaryFiles',
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

export const TBD = 'TBD';

export function getDataSchemaDependencies(
    schema: DataSchemaData,
    schemaDataById: SchemaDataById = {},
    excludeDependenciesWithTbdValues: boolean = true,
    getDependencyIds: (
        schema: DataSchemaData,
        schemaDataById?: SchemaDataById
    ) => string[] = getExclusiveDependencyIds
): DataSchemaData[] {
    const dependencyIds = getDependencyIds(schema, schemaDataById);
    const dependencies = _.compact(
        dependencyIds.map((id) => schemaDataById[id])
    );
    return excludeDependenciesWithTbdValues
        ? dependencies.filter((d) => d.description !== TBD)
        : dependencies;
}

export function sortDependenciesByAttribute(
    dependencyIds: string[],
    schemaDataById: SchemaDataById = {}
) {
    const dependencies = dependencyIds.map(
        // Fallback to dependency id in case no corresponding Schema found
        (id) => schemaDataById[id] || ({ id, attribute: id } as DataSchemaData)
    );
    return _.sortBy(dependencies, (d) => d.attribute).map((d) => d.id);
}

/**
 * Return all required dependency ids plus only exclusive conditional dependency ids.
 */
export function getExclusiveDependencyIds(
    schema: DataSchemaData,
    schemaDataById: SchemaDataById = {}
) {
    // sort both required and conditional dependencies alphabetically
    const requiredDependencies = sortDependenciesByAttribute(
        schema.requiredDependencies,
        schemaDataById
    );
    const conditionalDependencies = sortDependenciesByAttribute(
        schema.exclusiveConditionalDependencies,
        schemaDataById
    );
    return _.uniq([...requiredDependencies, ...conditionalDependencies]);
}

/**
 * Return all required and conditional dependency ids.
 */
export function getAllDependencyIds(
    schema: DataSchemaData,
    schemaDataById: SchemaDataById = {},
    keepDefaultOrderOfRequiredDependencies: boolean = true
) {
    // sort required dependencies alphabetically if needed
    const requiredDependencies = keepDefaultOrderOfRequiredDependencies
        ? schema.requiredDependencies
        : sortDependenciesByAttribute(
              schema.requiredDependencies,
              schemaDataById
          );

    // sort conditional dependencies alphabetically
    const conditionalDependencies = sortDependenciesByAttribute(
        schema.conditionalDependencies,
        schemaDataById
    );

    return _.uniq([...requiredDependencies, ...conditionalDependencies]);
}

export function getUniqDependencyIds(
    schemaDataIds: SchemaDataId[],
    schemaDataById?: SchemaDataById,
    getDependencyIds: (
        schema: DataSchemaData,
        schemaDataById?: SchemaDataById
    ) => string[] = getAllDependencyIds
) {
    return !_.isEmpty(schemaDataById)
        ? _.uniq(
              _.flatten(
                  schemaDataIds.map((schemaDataId) => {
                      const dataSchema = schemaDataById![schemaDataId];
                      return dataSchema
                          ? getDependencyIds(dataSchema, schemaDataById)
                          : [];
                  })
              )
          )
        : [];
}

export function getAttributeToSchemaIdMap(
    schema: DataSchemaData,
    schemaDataById: SchemaDataById
): { [attribute: string]: string } {
    const attributeToId: { [attribute: string]: string } = {};
    const dependencies = getDataSchemaDependencies(
        schema,
        schemaDataById,
        false,
        getAllDependencyIds
    );

    dependencies.forEach((s) => {
        if (s.attribute) {
            attributeToId[s.attribute] = s.id;
        }
    });

    return attributeToId;
}

export function getDataSchemaParents(
    schema: DataSchemaData,
    schemaDataById: SchemaDataById = {}
): DataSchemaData[] {
    return _.compact(schema.parentIds.map((id) => schemaDataById[id]));
}

export function getDataSchemaValidValues(
    schema: DataSchemaData,
    schemaDataById: SchemaDataById = {}
): DataSchemaData[] {
    return _.compact(schema.validValues.map((id) => schemaDataById[id]));
}

export function hasNonEmptyValidValues(schemaData: DataSchemaData[]): boolean {
    return !_.isEmpty(_.flatten(schemaData.map((s) => s.validValues)));
}

export async function getDataSchema(
    ids: SchemaDataId[],
    dataUri?: string
): Promise<{
    dataSchemaData: DataSchemaData[];
    schemaDataById: SchemaDataById;
}> {
    const schemaDataById = await fetchAndProcessSchemaData(dataUri);
    const dataSchemaData = _.compact(ids.map((id) => schemaDataById[id]));

    return { dataSchemaData, schemaDataById };
}

export async function fetchAndProcessSchemaData(
    dataUri?: string
): Promise<SchemaDataById> {
    const schemaDataUri = dataUri || (await getLatestReleaseSchemaUrl());
    const schemaData = getDataSchemaData(await fetchSchemaData(schemaDataUri));
    const schemaDataKeyedById = _.keyBy(schemaData, (d) => d.id);
    resolveConditionalDependencies(schemaData, schemaDataKeyedById);
    addAliases(schemaDataKeyedById);
    return schemaDataKeyedById;
}

export async function fetchSchemaData(dataUri?: string): Promise<SchemaJson> {
    if (!dataUri) {
        // return {
        //     '@context': defaultSchema['@context'],
        //     '@graph': defaultSchema['@graph'],
        //     '@id': defaultSchema['@id'],
        // } as SchemaJson;

        return DEFAULT_SCHEMA;
    }

    try {
        const res = await fetch(dataUri);

        // const json = await res.json();
        const text = await res.text();
        return JSON.parse(text);
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
            conditionalDependencies: [], // taken care of later with a full schema traversal
            exclusiveConditionalDependencies: [], // taken care of later with a full schema traversal
            validationRules: nd['sms:validationRules'] || [],
            validValues,
            domainIncludes,
            requiresComponent,
            source,
        } as DataSchemaData;
    };
}

/**
 * We sometimes manually modify the values and schema ids in the raw files.
 * This results in discrepancy with the schema json, so we need to manually add these alternative ids.
 */
export function addAliases(schemaDataById: SchemaDataById) {
    schemaDataById['bts:BulkDNALevel1'] = schemaDataById['bts:BulkWESLevel1'];
    schemaDataById['bts:BulkDNALevel2'] = schemaDataById['bts:BulkWESLevel2'];
    schemaDataById['bts:BulkDNALevel3'] = schemaDataById['bts:BulkWESLevel3'];
    schemaDataById['bts:ImagingLevel3'] =
        schemaDataById['bts:ImagingLevel3Segmentation'];
}

/**
 * Traverse the entire schema data and resolve the conditional dependencies by using the parentIds.
 *
 * Note that this adds all children to every single schema object as conditional dependencies,
 * so we end up having conditional dependencies even for primitive types.
 * For example `Number` ends up having `Integer` as a conditional dependency.
 */
export function resolveConditionalDependencies(
    schemaData: DataSchemaData[],
    schemaDataKeyedById: SchemaDataById
) {
    const requiredDependenciesReverseLookup = constructRequiredDependenciesReverseLookup(
        schemaData
    );

    schemaData.forEach((datum) =>
        getDataSchemaParents(datum, schemaDataKeyedById).forEach((parent) => {
            // add the current datum id as a conditional dependency to the parent
            // if it is not already included in the required dependencies
            if (!parent.requiredDependencies.includes(datum.id)) {
                parent.conditionalDependencies =
                    parent.conditionalDependencies || [];
                parent.conditionalDependencies.push(datum.id);

                // we only want to include current datum id as an exclusive conditional dependency
                // if it is not already listed as a required dependency in its parent's subtree.
                if (
                    !isAlreadyRequiredInSubtree(
                        datum,
                        parent,
                        schemaDataKeyedById,
                        requiredDependenciesReverseLookup
                    )
                ) {
                    parent.exclusiveConditionalDependencies =
                        parent.exclusiveConditionalDependencies || [];
                    parent.exclusiveConditionalDependencies.push(datum.id);
                }
            }
        })
    );
}

/**
 * Check if the datum is already included as a dependency in the parent's subtree.
 */
function isAlreadyRequiredInSubtree(
    datum: DataSchemaData,
    parent: DataSchemaData,
    schemaDataKeyedById: SchemaDataById,
    requiredDependenciesReverseLookup: { [schemaId: string]: string[] }
) {
    const entitiesRequiringDatum = requiredDependenciesReverseLookup[datum.id];

    return (
        !_.isEmpty(entitiesRequiringDatum) &&
        findAllAncestors(
            entitiesRequiringDatum,
            schemaDataKeyedById,
            requiredDependenciesReverseLookup
        ).includes(parent.id)
    );
}

/**
 * Find all ancestors (up to root) of given schema ids by using parentIds and requiredDependenciesReverseLookup.
 */
function findAllAncestors(
    schemaIds: string[],
    schemaDataKeyedById: SchemaDataById,
    requiredDependenciesReverseLookup: { [schemaId: string]: string[] }
) {
    const ancestors = [];
    const stack = [...schemaIds];

    while (stack.length > 0) {
        const id = stack.pop();

        if (id) {
            // both the parentIds and other entities listing current id as a required dependency is considered a parent
            const parents = _.uniq([
                ...(requiredDependenciesReverseLookup[id] || []),
                ...(schemaDataKeyedById[id]?.parentIds || []),
            ]);
            if (!_.isEmpty(parents)) {
                ancestors.push(...parents);
                stack.push(...parents);
            }
        }
    }

    return ancestors;
}

/**
 * Traverse the entire schema data and construct a lookup for each schema entity by mapping each entity to a list of
 * all parent ids where that specific entity is listed as a required dependency.
 */
export function constructRequiredDependenciesReverseLookup(
    schemaData: DataSchemaData[]
): { [schemaId: string]: string[] } {
    const requiredDependencies: { [schemaId: string]: string[] } = {};

    schemaData.forEach((datum) =>
        datum.requiredDependencies.forEach((id) => {
            requiredDependencies[id] = requiredDependencies[id] || [];
            requiredDependencies[id].push(datum.id);
        })
    );

    return requiredDependencies;
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
