"use strict";

const chalk = require('chalk');

const usage = `
Usage:
mongover <command> [<args>] [<options>]

Commands:   
  ${chalk.bold.cyan('init [<path>] [<options>]')}       
    - initializes a new Mongover Repository

      ${chalk.bold('SYNOPSIS')}
        $ mongover init [<path>] [-f json|-f dir]
      
      ${chalk.bold('ARGUMENTS')}
        <path>              path to mongover repository. Defaults to current working directory.

      ${chalk.bold('OPTIONS')}
        -f or --format      specifies Mongover Specification format, choose between 'json' and 'dir'. Defaults to 'json'.


  ${chalk.bold.cyan('extract [<path>] [<options>]')}   
    - Extracts the Mongover Specification of an existing MongoDB Server and initializes a new Mongover Repository with it

      ${chalk.bold('SYNOPSIS')}
        $ mongover extract [<path>] [[-h <host>] -u <username> -p <password> --authsource <authsource>] -d <dbName>[,...] [-c <collectionName>[,...]] [-q "<query>"[,...]] [-f json|-f dir] [-e yes|-e no]

      ${chalk.bold('ARGUMENTS')}
        <path>              path to mongover repository. Defaults to current working directory.

      ${chalk.bold('OPTIONS')}
        -h or --host        specifies the host of the host machine where the mongod or mongos is running. Defaults to '127.0.0.1:27017'.

        -u or --username    specifies a username with which to authenticate to a MongoDB database that uses authentication.

        -p or --password    specifies a password with which to authenticate to a MongoDB database that uses authentication.

        --authsource        specifies the database in which the user is created.

        -d or --db          specifies which databases are to be extracted.

        -c or --collection  specifies which collections are to be extracted. Defaults to all collections in specified databases.

        -f or --format      specifies Mongover Specification format, choose between 'json' and 'dir'. Defaults to 'json'.

        -e or --data        specifies if data from the MongoDB Server should also be exported, choose between 'yes' and 'no'. Defaults to 'yes'.
           
        
  ${chalk.bold.cyan('apply [<path>] [<options>]')}     
    - applies the current Mongover Specification to the MongoDB Server

      ${chalk.bold('SYNOPSIS')}
        $ mongover apply [<path>] [-h <host> [-u <username> -p <password> --authsource <authsource>]|-s <serverName>[,...]] [-d <dbName>[,...] [--as <asDbName>[,...]]] [-c <collectionName>[,...]]

      ${chalk.bold('ARGUMENTS')}
        <path>               path to mongover repository. Defaults to current working directory.

      ${chalk.bold('OPTIONS')}
        -h or --host         specifies the host of the host machine where the mongod or mongos is running. Defaults to all servers in Mongover Specification.

        -u or --username     specifies a username with which to authenticate to a MongoDB database that uses authentication.

        -p or --password     specifies a password with which to authenticate to a MongoDB database that uses authentication.

        --authsource         specifies the database in which the user is created.

        -s or --server       specifies which servers in the Mongover Specification to connect to. Defaults to all servers in Mongover Specification.

        -d or --db           specifies which databases to apply. Defaults to all databases in the Mongover Specification.

        --as                 specifies the aliases of the specified databases to apply, a database will use the alias corresponding to its index separated by commas.

        -c or --collection   specifies which collections to apply. Defaults to all collections in specified databases.                               
`;
const spec = {
  databases: {
    dbName: {
      collections: {
        collectionName: {
          options: {},
          upsertFields: ['fieldNameStr'],
          ignoreFields: ['fieldNameStr'],
          preservePrimaryKey: false,
          dropIndexesFirst: false,
          indexes: {
            indexName: {
              keys: {
                fieldName: 1
              },
              options: {},
              dropFirst: false
            }
          },
          dropFirst: false
        }
      },
      dropFirst: false
    }
  },
  servers: {
    serverName: {
      mongoUri: 'mongodb://127.0.0.1:27017/',
      databases: ['dbName', {
        db: 'dbName',
        as: 'dbNameTwo'
      }]
    }
  }
};
module.exports = {
  help: usage.trim(),
  spec: spec,
  exit: {
    success: 0,
    error: 1,
    //generic
    cannotExe: 126,
    //command invoked cannon execute
    notFound: 127,
    //command not found
    invalid: 128,
    //invalid argument
    terminated: 130 //ctrl-c

  }
};