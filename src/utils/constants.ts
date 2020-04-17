import { DatabaseSpec, MongoverOptions } from '../types/types';

export const usage = `
Usage:
  mongover <command> [<args>] [<options>]
  Commands:
    init [<specPath>] [<options>]
      - initializes a new Mongover Specification.
        SYNOPSIS
          $ mongover init [<specPath>] [-f dir|-f json]

        ARGUMENTS
          <specPath>              path to mongover specification. Defaults to current working directory.
        OPTIONS
          -f or --format          specifies Mongover Specification format, choose between 'dir' and 'json'. Defaults to 'dir'.

    extract [<specPath>] [<options>]
      - Extracts the Mongover Specification of an existing MongoDB Server and initializes a new Mongover Specification with it.
        SYNOPSIS
          $ mongover extract [<specPath>] [-u "<uri>"] [-d <dbName>[,...] [-c <collectionName>[,...]]] [-f dir|-f json] [-e jsonl|-e json|-e no [-q "<query>"]] [-i <infoCollection>]
        ARGUMENTS
          <specPath>              path to mongover specification. Defaults to current working directory.
        OPTIONS
          -u or --uri             specifies the uri of the running mongod or mongos. Defaults to 'mongodb://127.0.0.1:27017/'.
          -d or --dbs             specifies which databases are to be extracted.
          -c or --collections     specifies which collections are to be extracted. Defaults to all collections in specified databases.
          -f or --format          specifies Mongover Specification format, choose between 'dir' and 'json'. Defaults to 'dir'.
          -e or --export          specifies if data from the MongoDB Server should also be exported, choose between 'jsonl', 'json' and 'no'. Defaults to 'no'.
          -q or --query           specifies a filter which data to be exported from the MongoDB Server.
          -i or --info            specifies the collection name of the database information. Defaults to '_info'.

    apply [<specPath>] [<options>]
      - applies the current Mongover Specification to the MongoDB Server.
        SYNOPSIS
          $ mongover apply [<specPath>] [-u "<uri>"] [-d <dbName>[,...] [-a <alias>[,...]]] [-c <collectionName>[,...]] [-s] [-m] [-i <infoCollection>]
        ARGUMENTS
          <specPath>              path to mongover specification. Defaults to current working directory.
        OPTIONS
          -u or --uri             specifies the uri of the running mongod or mongos. Defaults to 'mongodb://127.0.0.1:27017/'.
          -d or --dbs             specifies which databases to apply. Defaults to all databases in the Mongover Specification.
          -a or --alias           specifies the aliases of the specified databases to apply, a database will use the alias corresponding to its index separated by commas.
          -c or --collections     specifies which collections to apply. Defaults to all collections in specified databases.
          -s or --seedOnly        specifies if mongover should only seed the database instead of migrating it when it already exists.
          -m or --migrateForce    specifies if mongover should migrate the database even if the specified version is lower or the same.
          -i or --info            specifies the collection name of the database information. Defaults to '_info'.
`.trim();

export const mongoverOptionsDefaults: MongoverOptions = {
  specPath: 'database',
  uri: 'mongodb://127.0.0.1:27017/',
  dbs: [],
  alias: [],
  collections: [],
  query: {},
  format: 'dir',
  export: 'no',
  seedOnly: false,
  migrateForce: false,
  info: '_info',
};

export const databaseSpecTemplate: DatabaseSpec = {
  seedOnly: false,
  migrateForce: false,
  info: '_info',
  dropFirst: false,
  alias: 'dbName',
  version: '1.0.0',
  collections: {},
};

export const collectionSpecTemplate = {
  dropFirst: false,
  dropIndexesFirst: false,
  options: {},
  indexes: [
    {
      dropFirst: false,
      keys: { fieldName: 1 },
      options: {},
    },
  ],
  data: {
    preservePrimaryKey: true,
    upsertFields: [ 'fieldName' ],
    ignoreFields: [ 'fieldName' ],
  },
};

export const dataSample = '{"_id":{"$oid":"aaaaaaaaaaaaaaaaaaaaaaaa"},"fieldName": 1}';

export const exit = {
  success: 0,
  error: 1,
};
