import { action, makeObservable, observable } from 'mobx';
import {
    FilterActionMeta,
    SelectedFilter,
    getNewFilters,
} from '@htan/data-portal-filter';
import {
    DataSchemaData,
    getDataSchemaDependencies,
} from '@htan/data-portal-schema';

export class DataStandardFilterControl {
    @observable allAttributeNames: string[] = [];
    @observable selectedAttributes: string[] = [];
    @observable private _selectedFilters: SelectedFilter[] = [];

    constructor(
        schemaData: DataSchemaData[],
        schemaDataById: Record<string, DataSchemaData> = {}
    ) {
        makeObservable(this);
        this.getAttributeNames(schemaData, schemaDataById);
    }

    @action
    getAttributeNames = (
        schemaData: DataSchemaData[],
        schemaDataById: Record<string, DataSchemaData>,
        attributeNames = new Set<string>()
    ) => {
        if (!schemaData) return attributeNames;

        schemaData.forEach((data) => {
            attributeNames.add(data.attribute);

            const dependencies = getDataSchemaDependencies(
                data,
                schemaDataById
            );
            this.getAttributeNames(
                dependencies,
                schemaDataById,
                attributeNames
            );
        });

        this.allAttributeNames = Array.from(attributeNames);
    };

    @action.bound
    handleSearch = (searchQuery: string) => {
        const searchedAttributes = this.allAttributeNames.filter((attribute) =>
            attribute.toLowerCase().includes(searchQuery.toLowerCase())
        );
        this.selectedAttributes = searchedAttributes;
    };

    @action.bound
    handleFilterChange = (
        filters: SelectedFilter[] | FilterActionMeta<SelectedFilter>
    ) => {
        if (!Array.isArray(filters)) {
            if (filters.action === 'select-option' && filters.option) {
                this._selectedFilters.push(filters.option);
            } else {
                return;
            }
        } else {
            this._selectedFilters = filters;
        }

        this.updateSelectedAttributes();
    };

    @action.bound
    clearFilter = (filterValue: string) => {
        this._selectedFilters = this._selectedFilters.filter(
            (filter) => filter.value !== filterValue
        );
        this.updateSelectedAttributes();
    };

    @action.bound
    clearAllFilters = () => {
        this._selectedFilters = [];
        this.selectedAttributes = this.allAttributeNames;
    };

    @action.bound
    updateSelectedAttributes = () => {
        const selectedAttributeValues = this._selectedFilters.map(
            (filter) => filter.value
        );
        this.selectedAttributes = this.allAttributeNames.filter((attribute) =>
            selectedAttributeValues.includes(attribute)
        );
    };

    @action.bound
    updateSelectedAttributesDirectly = (attributes: string[]) => {
        this.selectedAttributes = attributes;
    };

    getSelectedFilters = () => this._selectedFilters;

    get selectedFilters(): SelectedFilter[] {
        return this._selectedFilters;
    }

    set selectedFilters(filters: SelectedFilter[]) {
        this._selectedFilters = filters;
        this.updateSelectedAttributes();
    }

    @action.bound
    setFilter(actionMeta: FilterActionMeta<SelectedFilter>) {
        this.selectedFilters = getNewFilters(this.selectedFilters, actionMeta);
    }
}
