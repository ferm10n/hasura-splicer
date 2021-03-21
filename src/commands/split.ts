import fs from 'fs';
import yaml from 'yaml';
import path from 'path';
import type {
    Metadata,
    MetadataTable,
    SplicerState
} from '../types';

/**
 * @param hasuraDir - path to where migrations and metadata folders are kept
 */
function readMetadata (hasuraDir: string) {
    const fileMap: { [K in keyof Metadata]: string } = {
        tables: path.join(hasuraDir, 'metadata/tables.yaml'),
        actions: path.join(hasuraDir, 'metadata/actions.yaml'),
        actionsGql: path.join(hasuraDir, 'metadata/actions.graphql')
    };

    const metadata: Partial<Metadata> = {};
    for (const metadataType in fileMap) {
        const filePath = fileMap[metadataType as keyof Metadata];

        if (fs.existsSync(filePath)) {
            const fileData = fs.readFileSync(filePath, 'utf8');
            const isGql = Boolean(path.extname(filePath).match(/\.graphql$/ui));
            metadata[metadataType as keyof Metadata] = isGql ? fileData : yaml.parse(fileData);
        }
    }

    if (!metadata.tables) {
        throw new Error(`failed to process metadata. ${hasuraDir}/metadata/tables.yaml is required`)
    }

    return metadata;
}

/**
 * - resolve metadata location
 * - parse the metadata
 * - go through each table entry
 *      - if the table belongs to a scoped folder already defined, add it
 *      - if the schema has not been defined, then add it
 *      - if multiple scoped folders have the schema defined, throw
 *      - if the table has a relationship that belongs to a different schema, add it to the list of things for the user to resolve
 * - prompt the user about where to put each non-table metadata, and relationship we added in the previous step
 * - write the metadata to each of the folders
 * - create/update the config.yaml for each folder
 */
export function split (state: SplicerState) {
    // TODO: check which folder a table should go into, and check if there is ambiguity, like if multiple folders specify the same schema
    // for (const folder of splicerConfig.folders) {
    //     for (const schema of folder.schemas) {
    //         if (config.expectedSchemas.has(schema)) {
    //             throw new Error(`splicer config is invalid. module schema "${schema}" was referenced more than once`);
    //         }
    //         config.expectedSchemas.add(schema);
    //     }
    // }

    const metadataPath = state.hasuraConfig.metadata_directory || path.join(state.hasuraDir, 'metadata');
    const fullMetadata = readMetadata(metadataPath);

    const folderTargets: {
        /** absolute path to the planned scoped metadata folder */
        path: string;
        schemas: string[];
        tables: MetadataTable[];
    }[] = state.splicerConfig.folders.map(f => ({
        path: f.path,
        tables: [],
        schemas: f.schemas || [],
    }));

    // check each table
    for (const tableMetadata of fullMetadata.tables || []) {
        const schema = tableMetadata.table.schema;
        // try to find a matching entry in the map
        const possibleFolderTargets = folderTargets.filter(ft => ft.schemas.includes(schema));
        if (possibleFolderTargets.length > 1) {
            throw new Error(`splicer config is invalid. multiple folders specify the same schema: ${possibleFolderTargets.map(ft => ft.path).join(', ')}`);
        }
        if (possibleFolderTargets.length === 0) {
            possibleFolderTargets.push({
                path: path.join(state.hasuraDir, '..', schema),
                schemas: [ schema ],
                tables: [ tableMetadata.table ],
            });
        }

        // TODO check for ambiguous relationships
    }

    // const newModules = [];
    // for (const tableMetadata of fullMetadata.tables) {
    //     const tableSchema = tableMetadata.table.schema;
    //     if (!config.expectedSchemas.has(tableSchema)) { // is this a new module?
    //         // acknowledge it
    //         newModules.push(tableSchema);
    //         config.expectedSchemas.add(tableSchema);
    //         config.modules.push({
    //             path: path.join('..', tableSchema),
    //             schemas: [ tableSchema ]
    //         });
    //     }
    // }

    // for (const metadataModule of config.modules) {
    //     // ensure the dir for the module exists
    //     fs.mkdirSync(metadataModule.path, { recursive: true });

    //     // ensure a config.yaml exists
    //     const modConfigPath = path.join(metadataModule.path, 'config.yaml');
    //     if (!fs.existsSync(modConfigPath)) {
    //         fs.writeFileSync(modConfigPath, yaml.stringify(config.hasuraConfig), 'utf8');
    //     }
    // }

    // update the full config.yaml
    // config.

    console.log('Added from new schemas:', newModules);
}
