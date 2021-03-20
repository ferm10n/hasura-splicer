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
 * - walk through
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

    /** mapping from the folder path to the tables to write there */
    const splitTablesMap = new Map<string, MetadataTable[]>();

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
