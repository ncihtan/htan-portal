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

export const DEFAULT_SCHEMA: SchemaJson = {
    '@context': {},
    '@graph': [],
    '@id': '',
}

export const DEFAULT_SCHEMA_URL = "https://raw.githubusercontent.com/ncihtan/schematic/main/data/schema_org_schemas/HTAN.jsonld";

const schemaDataCache: {[uri: string]: SchemaJson} = {};

export function getDataSchemaDependencies(
    schema: DataSchemaData,
    schemaDataMap: {[id: string]: DataSchemaData} = {}
): DataSchemaData[] {
    return _.compact(schema.requiredDependencies.map(id => schemaDataMap[id]));
}

export function getDataSchemaParents(
    schema: DataSchemaData,
    schemaDataMap: {[id: string]: DataSchemaData} = {}
): DataSchemaData[] {
    return _.compact(schema.parentIds.map(id => schemaDataMap[id]));
}

export function getDataSchemaValidValues(
    schema: DataSchemaData,
    schemaDataMap: {[id: string]: DataSchemaData} = {}
): DataSchemaData[] {
    return _.compact(schema.validValues.map(id => schemaDataMap[id]));
}

export function hasNonEmptyValidValues(schemaData: DataSchemaData[]): boolean {
    return !_.isEmpty(_.flatten(schemaData.map(s => s.validValues)));
}

export async function getDataSchema(
    ids: string[],
    dataUri: string = DEFAULT_SCHEMA_URL
): Promise<{
    dataSchemaData: DataSchemaData[],
    schemaDataMap: {[id: string]: DataSchemaData}
}> {
    const schemaData = getDataSchemaData(await getSchemaData(dataUri));
    const schemaDataMap = _.keyBy(schemaData, d => d.id);
    const dataSchemaData = _.compact(ids.map(id => schemaDataMap[id]));

    return {dataSchemaData, schemaDataMap};
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
    const schema: SchemaData[] = schemaJson ? schemaJson['@graph'] || [] : []
    const context: SchemaContext = schemaJson
        ? schemaJson['@context'] || {}
        : {};

    if (schema.length > 0) {
        return schema.map(mapSchemaDataToDataSchemaData(context));
    }

    return [] as DataSchemaData[];
}

export function mapSchemaDataToDataSchemaData(context: SchemaContext): (nd: SchemaData) => DataSchemaData {
    return function (nd: SchemaData): DataSchemaData {
        const parentIds: string[] = (normalizeEntity(
            nd['rdfs:subClassOf'],
        ) as BaseEntity[]).map((rd: BaseEntity): string => rd['@id']);

        const pieces: string[] = nd['@id'].split(`:`);
        const source: string = `${context[pieces[0]]}${pieces[1]}`;

        const type: string[] = (normalizeEntity(nd['@type']) as string[]).map(
            (rd: string): string => rd,
        );

        const requiredDependencies: string[] = (normalizeEntity(
            nd['sms:requiresDependency'],
        ) as BaseEntity[]).map((rd: BaseEntity): string => rd['@id']);

        const validValues: string[] = (normalizeEntity(
            nd['schema:rangeIncludes'],
        ) as BaseEntity[]).map((rd: BaseEntity): string => rd['@id']);

        const requiresComponent: string[] = (normalizeEntity(
            nd['sms:requiresComponent'],
        ) as BaseEntity[]).map((rd: BaseEntity): string => rd['@id']);

        const domainIncludes: string[] = (normalizeEntity(
            nd['schema:domainIncludes'],
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
    }
}

function normalizeEntity(
    entity: string | string[] | BaseEntity | BaseEntity[] | undefined,
): (string | BaseEntity)[] {
    return !entity ? [] : !Array.isArray(entity) ? Array(entity) : entity;
}
