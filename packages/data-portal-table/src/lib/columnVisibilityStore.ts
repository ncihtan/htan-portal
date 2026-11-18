import { action, observable } from 'mobx';

export type ColumnVisibilityMap = { [columnKey: string]: boolean };

// In-memory store for user selected column visibility, keyed by table.
// This lets a table keep the user's column selection when it is unmounted and
// mounted again (e.g. when the Explore page rerenders after a filter change).
// The state intentionally lives only for the current page session.
const columnVisibilityByKey = observable.map<string, ColumnVisibilityMap>(
    {},
    { deep: false }
);

export function getStoredColumnVisibility(
    key: string
): ColumnVisibilityMap | undefined {
    return columnVisibilityByKey.get(key);
}

export const setStoredColumnVisibility = action(
    (key: string, columnVisibility: ColumnVisibilityMap) => {
        // always store a copy so that observers are notified
        // even if the caller mutated the previously stored object
        columnVisibilityByKey.set(key, { ...columnVisibility });
    }
);
