import path from 'path';
import fs from 'fs';
import yaml from 'yaml';
import Ajv from 'ajv';
import splicerSchema from './splicer-schema.json';
import type {
    SplicerError,
    SplicerConfig
} from './types';

export function loadConfig (configPath: string) {
    const fullConfigPath = path.resolve(configPath);
    const hasuraConfigSrc = fs.readFileSync(fullConfigPath, 'utf8');
    const hasuraConfig = yaml.parse(hasuraConfigSrc);

    const config: Partial<SplicerConfig> = hasuraConfig.splicer || {};
    const ajv = new Ajv();
    const validate = ajv.compile(splicerSchema);
    if (!validate(config)) {
        const err = new Error(`splicer config in ${fullConfigPath} is invalid`) as SplicerError;
        err.errors = validate.errors;
        throw err;
    }

    if (!config.modules) {
        config.modules = [];
    }

    config.expectedSchemas = new Set<string>();
    for (const splicerModule of config.modules) {
        for (const schema of splicerModule.schemas) {
            if (config.expectedSchemas.has(schema)) {
                throw new Error(`splicer config is invalid. module schema "${schema}" was referenced more than once`);
            }
            config.expectedSchemas.add(schema);
        }
    }

    config.fullHasuraDir = path.dirname(fullConfigPath);
    delete hasuraConfig.splicer;
    config.hasuraConfig = hasuraConfig;

    return config as SplicerConfig;
}
