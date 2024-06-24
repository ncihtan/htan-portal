import { action, makeObservable, observable, computed } from 'mobx';
import { DataSchemaData } from '@htan/data-portal-schema';

export class DataStandardFilterStore {
    @observable searchText: string = '';
    private schemaData: DataSchemaData[];
    private dataSchemaMap: { [id: string]: DataSchemaData };

    constructor(
        schemaData: DataSchemaData[],
        dataSchemaMap: { [id: string]: DataSchemaData }
    ) {
        makeObservable(this);
        this.schemaData = schemaData;
        this.dataSchemaMap = dataSchemaMap;
    }

    @action.bound
    setSearchText(text: string) {
        this.searchText = text;
    }

    @computed
    get filteredSchemaDataById(): { [id: string]: DataSchemaData } {
        const searchTextLower = this.searchText.toLowerCase();
        const schemaDataIds = new Set(this.schemaData.map((data) => data.id));

        if (searchTextLower.length === 0) {
            // Default logic when nothing is searched for
            const entries = Object.entries(
                this.dataSchemaMap
            ).filter(([key, value]) =>
                this.schemaData.some((data) => data.id === value.id)
            );
            return Object.fromEntries(entries);
        }

        const filteredEntries = Object.entries(this.dataSchemaMap).filter(
            ([key, value]) => {
                const attributeMatches = value.attribute
                    .toLowerCase()
                    .includes(searchTextLower);
                const descriptionMatches = value.description
                    .toLowerCase()
                    .includes(searchTextLower);
                const parentIdMatches = value.parentIds.some((parentId) =>
                    schemaDataIds.has(parentId)
                );

                return (
                    (attributeMatches || descriptionMatches) && parentIdMatches
                );
            }
        );

        return Object.fromEntries(filteredEntries);
    }

    @computed
    get isFiltered(): boolean {
        return this.searchText.length > 0;
    }
}
