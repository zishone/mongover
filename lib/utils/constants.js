const usage = `
Usage:
mongover <command> [<args>]

  Commands:                       Descriptions:
  help                            - shows usage
  init [<path>]                   - initializes a new Mongover Repository
  apply [<path>]                  - applies the current Mongover Specification to the MongoDB Server
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
