export type SplicerConfig = {
    /** path to the original directory this scoped folder was created from */
    origin?: string;
    folders: {
        /**
         * path to the scoped folder. either absolute, or relative to the config.yaml
         */
        path: string;
        /**
         * if set, then this either says which schemas were extracted to produce this folder,
         * or describes which schemas *should* be extracted
         */
        schemas?: string[]
    }[];
};

export type HasuraConfig = {
    version: number;
    endpoint: string;
    admin_secret: string;
    /** if not set, this will be defaulted to `<configPath>/../metadata` */
    metadata_directory: string;
    splicer?: SplicerConfig;
};

/**
 * state for the application
 */
export type SplicerState = {
    // /** a set of all the schemas from the splicer module config */
    // expectedSchemas: Set<string>;
    /** absolute path to the dir containing config.yaml */
    hasuraDir: string;

    /** parsed config.yaml from `configPath` */
    hasuraConfig: HasuraConfig;

    /** reference to HasuraConfig.splicer obj */
    splicerConfig: SplicerConfig;
};

export type MetadataType = 'tables' | 'actions' | 'actionsGql';

export type MetadataTable = {
    schema: string;
    name: string;
};

export type Metadata = {
    tables: {
        table: MetadataTable;
    }[],
    actions: unknown,
    actionsGql: unknown
};

export interface SplicerError extends Error {
    [ extra: string ]: unknown;
}
