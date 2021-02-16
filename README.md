# Hasura Metadata Splicer

Splits and/or joins hasura metadata into parts.

*Like an antitrust for your hasura metadata*

## Features

- utility to keep you metadata "modularized"
- split a massive `tables.yaml` into parts by their schema
- avoids forcing you to edit the metadata files by hand
- easier process for reviewing and merging pull requests when metadata is separated by their functional role
- automatically apply metadata from different directories with a single command
- works well with `hasura console`. changes made while in the console will be automatically stored to a selected metadata directory
- easy switching between which is the actively selected metadata directory
- support for these metadata types:
    - [ ] actions
    - [ ] allow_list
    - [ ] cron_triggers
    - [ ] functions
    - [ ] query_collections
    - [ ] remote_schemas
    - [ ] tables

See https:// github . com/hasura/graphql-engine/issues/5643

If you're developing something that involves a LOT of tables, managing the metadata for everything can be a real challenge. This might be the tool for you.

## How it works

### Getting started - Splitting a tables.yaml

This would be the expected starting point for using the splicer if you're introducing it to a new project. Let's suppose you start out with a directory structure like this:

```
hasura
└── full
    ├── config.yaml
    ├── metadata
    │   ├── actions.graphql
    │   ├── actions.yaml
    │   ├── allow_list.yaml
    │   ├── cron_triggers.yaml
    │   ├── functions.yaml
    │   ├── query_collections.yaml
    │   ├── remote_schemas.yaml
    │   ├── tables.yaml
    │   └── version.yaml
    └── migrations
        ├── 0000000000000_init
        │   ├── down.sql
        │   └── up.sql
        └── ...
```

Here's what would happen:

- `npm i -g hasura-splicer`
- `cd` into `hasura/full` and run `npx hasura-splicer split`
- the splicer scans through all `table.schema`s to determine what the modules should be
- directories are created for each module
- the `config.yaml` is also copied over to each of the directories
    - if the `config.yaml` already exists in the target directory, it is not modified
- the `table` objects are now split into each of the modules
    - if metadata already exists in the module directory, it will be merged with the metadata coming from `hasura/full`
    - the splicer tries to use a smart merging strategy, meaning that matching is performed on the table name and schema... not just simply doing a concat of the `tables.yaml`
- the splicer can't always infer which module a object/array relationship belongs to. in these situations, the user will be prompted for each one
- [ stuff about actions and other metadata stuff goes here ]
- a reference to each of the modules will be added to `hasura/full/config.yaml`
- If you have `app1` and `app2` as schemas, your dir tree will now look like this:
```
hasura
├── full
│   ├── config.yaml
│   ├── metadata
│   │   ├── tables.yaml
│   │   └── ...
│   └── migrations
│       ├── 0000000000000_init
│       │   ├── down.sql
│       │   └── up.sql
│       └── ...
├── app1
│   ├── config.yaml
│   ├── metadata
│   │   ├── tables.yaml
│   │   └── ...
│   └── migrations/
└── app2
    ├── config.yaml
    ├── metadata
    │   ├── tables.yaml
    │   └── ...
    └── migrations/
```

Your `hasura/full/config.yaml` will now look like this:
```yaml
version: 2
# ...
splicer:
  modules:
    - path: ../app1
      schemas: [app1]
    - path: ../app2
      schemas: [app2]
```

### Normal usage with watch mode

- `cd` into the directory where all the metadata modules are being merged together (`hasura/full` in the earlier example).
- `npx hasura-splicer join --all -w`
- `hasura/full/config.yaml` will be read to determine the available modules
- metadata from each module will be read, merged, and written to the full metadata directory
    - **existing metadata will be overwritten**
- you will then be prompted for which module should be made "active"
<!-- - the newly merged full metadata structure will be read and be made the "current" -->
- file watchers will be created for the full metadata folder
- you can now make edits with `hasura console`
- when the splicer detects a change in a metadata file
    <!-- - take the old "current" full metadata -->
    - for each module that isn't the "active module", subtract the module's metadata from the full metadata
    - what remains will be the new metadata for the active module
    - apply these changes to the "active" module using an **overwrite**
        - in this way, if relationships or tables are replaced, the old ones are removed

Basically, the idea is that at any given moment: `app1Metadata + app2Metadata = fullMetadata`

When a change occurs, we can identify that change with: `change = newFullMetadata - app1Metadata - app2Metadata`

If `app1` was our active module, then: `newApp1Metadata = newFullMetadata - app2Metadata`

### Usage without watch mode

- `cd` into the directory where all the metadata modules are being merged together (`hasura/full` in the earlier example).
- `npx hasura-splicer join --all`
- for each of the `splicer.modules` in `hasura/full/config.yaml`, create a complete metadata structure by merging each of them in the order they appear, and write the resulting files to `hasura/full/metadata`
