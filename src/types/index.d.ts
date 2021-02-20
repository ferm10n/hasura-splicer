export type SplicerConfig = {
    modules: {
        path: string;
        schemas: string[];
    }[];
    fullHasuraDir: string;
    /** a set of all the schemas from the splicer module config */
    expectedSchemas: Set<string>;
    hasuraConfig: unknown;
};

export type MetadataType = 'tables' | 'actions' | 'actionsGql';

export type Metadata = {
    tables: {
        table: {
            schema: string;
            name: string;
        }
    }[],
    actions: unknown,
    actionsGql: unknown
};

export interface SplicerError extends Error {
    [ extra: string ]: unknown;
}
