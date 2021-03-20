# Hasura Metadata Splicer

Splits and/or joins hasura metadata into parts.

*Like an antitrust for your hasura metadata*

**NOTE:** this project is still a WIP and has not been published yet!

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
### Getting started

- You can run the project by getting it from npm `npx hasura-splicer <command args...>`
- or install this project as a global npm module `npm i -g hasura-splicer` (the rest of this README will assume this is what you have done)
- or you can install it from source
```sh
npm install
npm run build
npm i -g
```

## Usage

### Splitting a tables.yaml

This would be the expected starting point for using the splicer if you're introducing it to a new project.

Navigate into the directory with your `config.yaml`, `metadata`, and `migrations`, then run

`hasura-splicer split`

This will by default, take all the tables defined in `tables.yaml` and split it by schema, creating a folder for each. We'll refer to these as "scoped metadata folders".

Next, hasura-splicer will write and entry for each of the scoped folders in your original `config.yaml`, like this:

```yaml
# config.yaml
version: 2
endpoint: http://localhost:8080
admin_secret: admin_secret
metadata_directory: metadata
actions:
  kind: synchronous
  handler_webhook_baseurl: http://localhost:3000
splicer:
  folders:
    - path: ../schema1
      schemas:
        - schema1
    - path: ../schema2
      schemas:
        - schema2
    # ...
```

If you would like to group multiple schemas together during the `split` command, or want to control where the folders will be created, you can write the `splicer` section yourself before running the command.

This also allows you to re-run the split command whenever you wish.

Each of the scoped folders will also receive a `config.yaml` that contain references to the other scoped folders.

**NOTE:** splitting by schemas is just the default. You're free to reorganize the scoped folders however you wish, and even remove the `schemas` fields

### Editing a split metadata folder with hasura console

From a scoped folder (like schema1 or schema2 from the earlier example), simply call

`hasura-splicer console [scopedFolder1, ...]`

After this, all the referenced `splicer.folders` (or `scopedFolders` if you override) will be merged together in a temporary folder to create the full metadata, and then it is applied.

Next, `hasura console` is called in this temp folder, effectively making `hasura-splicer console` a wrapper for `hasura console`.

File watchers are then created on the temp folder, and anytime a change made by the console is detected, the splicer tries to determine which scoped folder should receive the change:

- if metadata is removed, then it finds the scoped folder it was defined in, and removes it
- if metadata is added, it will be added to the scoped folder you ran `hasura-splicer console` in. This includes tables, actions, relationships (even those on a table not controlled by this scoped folder), etc

### Joining the metadata back together

When it comes time to deploy, you will want to bring everything back together.

`hasura-splicer join [scopedFolder1, ...] [destinationFolder]`

This will do a simple merge of each of the scoped folders referenced in `splicer.folders` (or `scopedFolders` if you override). Any existing metadata in the destinationFolder will be overwritten.

## Example

Let's suppose you start out with a directory structure like this, and run `hasura-splicer split` from the `hasura/full` dir:

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

- the splicer scans through all `table.schema`s to determine what folders should be created
- a folder is created for each schema, and a `config.yaml` is written to each
  - if the `config.yaml` already exists in the target directory, it is not modified
- metadata is split and written to the appropriate folders
  - usually it's easy with tables to determine which folder it belongs in, by checking its schema. however, sometimes the splicer can't infer this in these types of situations:
    - object/array relationships between tables of different schemas assigned to different folders
    - non table metadata
  - in these situations, you will be prompted to pick a folder for each
- if metadata already exists in the target folders, it will be overwritten. however if a `config.yaml` exists, only the `splicer` section will be modified using a merge strategy
- if you have `app1` and `app2` as schemas, your dir tree will now look like this:

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

Here's what the `config.yaml`s will look like for each folder now:

```yaml
# hasura/full/config.yaml

version: 2
# ...
splicer:
  origin: .
  folders:
    - path: ../app1
      schemas:
        - app1
    - path: ../app2
      schemas:
        - app2
```

```yaml
# hasura/app1/config.yaml

version: 2
# ...
splicer:
  origin: ../full
  folders:
    - path: ../app2
    - path: .
```

```yaml
# hasura/app2/config.yaml

version: 2
# ...
splicer:
  origin: ../full
  folders:
    - path: ../app1
    - path: .
```
