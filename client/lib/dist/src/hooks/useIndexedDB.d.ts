export type UseIndexedDBProps = {
    clientType: null;
};
export type IndexedDBState = {
    dummy: string;
};
export type IndexedDBStateAndMethod = IndexedDBState & {
    setItem: (key: string, value: unknown) => Promise<void>;
    getItem: (key: string) => Promise<unknown>;
    removeItem: (key: string) => Promise<void>;
    removeDB: () => Promise<void>;
};
export declare const useIndexedDB: (props: UseIndexedDBProps) => IndexedDBStateAndMethod;
