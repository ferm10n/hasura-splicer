import path from 'path';
import fs from 'fs';
import yaml from 'yaml';
import Ajv from 'ajv';
import splicerSchema from './splicer-schema.json';
import type {
    SplicerError,
    SplicerConfig,
    SplicerState,
    HasuraConfig,
} from './types';

/** creates initial application state from config.yaml */
export function loadConfig (configPath: string): SplicerState {
    const fullConfigPath = path.resolve(configPath);
    const hasuraConfigSrc = fs.readFileSync(fullConfigPath, 'utf8');
    const hasuraConfig: HasuraConfig = yaml.parse(hasuraConfigSrc);

    const ajv = new Ajv();
    const validate = ajv.compile(splicerSchema);
    if (!validate(hasuraConfig)) {
        const err = new Error(`hasura config at ${fullConfigPath} is invalid`) as SplicerError;
        err.errors = validate.errors;
        throw err;
    }

    const state: SplicerState = {
        hasuraDir: path.dirname(fullConfigPath),
        hasuraConfig,
        splicerConfig: hasuraConfig.splicer || {
            folders: [],
        },
    };

    // check that there are no duplicate paths
    // also normalize path
    const seenPaths = new Set();
    for (const folder of state.splicerConfig.folders) {
        if (seenPaths.has(folder.path)) {
            throw new Error(`splicer config is invalid. duplicate paths detected: ${folder.path}`);
        }
        seenPaths.add(folder.path);
        folder.path = path.relative(fullConfigPath, folder.path);
    }

    return state;
}
