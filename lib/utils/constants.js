const usage = `
Usage:
mongover <command> [<args>] [<options>]

  Commands:                       Descriptions:
  init [<path>] [<options>]       - initializes a new Mongover Repository
                                    SYNOPSYS
                                      $ mongover init [<path>] [--spec json|--spec dir]
                                    
                                    ARGUMENTS
                                      <path>            path to mongover repository. Defaults to current working directory.

                                    OPTIONS
                                      --spec            specifies Mongover Specification format, choose between 'json' and 'dir'. Default: 'json'.
  extract [<path>] [<options>]    - Extracts the Mongover Specification of an existing MongoDB Server and initializes a new Mongover Repository with it
                                    SYNOPSYS
                                      $ mongover extract [<path>] [[--host <host>] --username <username> --password <password> --authsource <authsource>] --db <dbName>[,...] [--collection <collectionName>[,...]] [--spec json|--spec dir] [--data yes|--data no]

                                    ARGUMENTS
                                      <path>            path to mongover repository. Defaults to current working directory.

                                    OPTIONS
                                      --host            specifies the host of the host machine where the mongod or mongos is running. Default: '127.0.0.1:27017'.

                                      --username        specifies a username with which to authenticate to a MongoDB database that uses authentication.

                                      --password        specifies a password with which to authenticate to a MongoDB database that uses authentication.

                                      --authsource      specifies the database in which the user is created.

                                      --db              specifies which databases are to be extracted.

                                      --collection      specifies which collections are to be extracted. Defaults to all collections in specified databases.

                                      --spec            specifies Mongover Specification format, choose between 'json' and 'dir'. Default: 'json'.

                                      --data            specifies if data from the MongoDB Server should also be extracted, choose between 'yes' and 'no'. Default: 'yes'.
  apply [<path>] [<options>]      - applies the current Mongover Specification to the MongoDB Server
                                    SYNOPSYS
                                      $ mongover apply [<path>] [--host <host> [--username <username> --password <password> --authsource <authsource>]|--server <serverName>[,...]] [--db <dbName>[,...] [--as <asDbName>[,...]]] [--collection <collectionName>[,...]]

                                    ARGUMENTS
                                      <path>            path to mongover repository. Defaults to current working directory.

                                    OPTIONS
                                      --host            specifies the host of the host machine where the mongod or mongos is running. Defaults to all servers in Mongover Specification.

                                      --username        specifies a username with which to authenticate to a MongoDB database that uses authentication.
                                
                                      --password        specifies a password with which to authenticate to a MongoDB database that uses authentication.
                                
                                      --authsource      specifies the database in which the user is created.
                                
                                      --server          specifies which servers in the Mongover Specification to connect to. Defaults to all servers in Mongover Specification.
                                
                                      --db              specifies which databases to apply. Defaults to all databases in the Mongover Specification.
                                
                                      --as              specifies the aliases of the specified databases to apply, database will use the alias corresponding to its index sperated by commas.
                                
                                      --collection      specifies which collections to apply. Defaults to all collections in specified databases.
`;

const spec = {
  databases: {
    dbName: {
      collections: {
        collectionName: {
          options: {},
          upsertFields: [
            'fieldNameStr'
          ],
          ignoreFields: [
            'fieldNameStr'
          ],
          preserveObjectId: false,
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
      databases: [
        'dbName',
        {
          db: 'dbName',
          as: 'dbNameTwo'
        }
      ]
    }
  }
};

module.exports = {
  help: usage.trim(),
  spec: spec,
  exit: {
    success: 0,
    error: 1, //generic
    cannotExe: 126, //command invoked cannon execute
    notFound: 127, //command not found
    invalid: 128, //invalid argument
    terminated: 130 //ctrl-c
  }
};
