#!/usr/bin/env node
import { program } from 'commander';
import { split } from './commands/split';
import { loadConfig } from './config';
import pkg from '../package.json';

try {
    program.version(pkg.version);
    program.description('Like an antitrust for your hasura metadata.');
    program.option('-c, --config <path>', 'path to the hasura config.yml', './config.yaml');

    const splitCommand = program.command('split');
    splitCommand.description('split metadata into parts by their schema');
    splitCommand.action((args, opts) => {
        const state = loadConfig(program.opts().config);
        split(state);
    });

    // show help when not used correctly
    program.command('', {
        isDefault: true,
        hidden: true,
    }).action(() => {
        program.help();
        process.exit(1);
    });

    program.parse(process.argv);
    process.exit(0);
} catch (err) {
    console.error(err);
    process.exit(1);
}