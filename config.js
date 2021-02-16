const path = require('path');
const fs = require('fs');
const yaml = require('yaml');
const Ajv = require('ajv').default;
const splicerSchema = require('./schema.json');

function loadConfig (configPath) {
    const fullConfigPath = path.resolve(configPath);
    const configSrc = fs.readFileSync(fullConfigPath, 'utf8');
    
    const config = yaml.parse(configSrc);
    const ajv = new Ajv();
    const validate = ajv.compile(splicerSchema);
    if (!validate(config)) {
        const err = new Error(`splicer config in ${fullConfigPath} is invalid`);
        err.errors = validate.errors;
        throw err;
    }

    // paths that splicer will try to join/split
    const managedPaths = [
        'metadata/actions.graphql',
        'metadata/actions.yaml',
        'metadata/tables.yaml'
    ];
    for (const part of config.splicer.parts) {
        fs.mkdirSync(part.path, { // ensure the directory exists
            recursive: true
        });
    }

    return config;
}

module.exports = {
    loadConfig
};
