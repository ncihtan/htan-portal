export interface IAttributeInfo<T> {
    path?: string;
    getValues?: (e: T) => string[];
    displayName: string;
    caseFilter?: boolean;
}
