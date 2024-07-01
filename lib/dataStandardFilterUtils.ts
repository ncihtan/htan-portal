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

        if (searchTextLower.length === 0) {
            // Default logic when nothing is searched for
            return this.dataSchemaMap;
        }

        // Finding the schema data entry for the searched text
        const matchingSchemaData = this.schemaData.find(
            (data) =>
                data.id.toLowerCase().includes(searchTextLower) ||
                data.attribute.toLowerCase().includes(searchTextLower)
        );

        console.log('Matching schemaData:', matchingSchemaData);

        if (!matchingSchemaData) {
            const matchInDependencies = this.schemaData.find((data) =>
                data.requiredDependencies.some(
                    (dep) =>
                        dep.toLowerCase().includes(searchTextLower) ||
                        this.dataSchemaMap[dep]?.attribute
                            .toLowerCase()
                            .includes(searchTextLower)
                )
            );

            if (matchInDependencies) {
                // Find the matching dependency
                const matchingDep = matchInDependencies.requiredDependencies.find(
                    (dep) =>
                        dep.toLowerCase().includes(searchTextLower) ||
                        this.dataSchemaMap[dep]?.attribute
                            .toLowerCase()
                            .includes(searchTextLower)
                );

                if (matchingDep && this.dataSchemaMap[matchingDep]) {
                    console.log('Matching dependency:', matchingDep);
                    return { [matchingDep]: this.dataSchemaMap[matchingDep] };
                }
            }

            return {};
        }

        // Get the matching entry from the dataSchemaMap
        const matchingEntry = this.dataSchemaMap[matchingSchemaData.id];

        if (!matchingEntry) {
            return {};
        }

        // Create an object with just the matching entry
        const result = { [matchingEntry.id]: matchingEntry };
        return result;
    }

    @computed
    get isFiltered(): boolean {
        return this.searchText.length > 0;
    }
}
