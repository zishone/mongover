const chalk = require('chalk');
const fs = require('fs-extra');
const path = require('path');

const constants = require('../utils/constants');

const init = (arg) => {
  const repo = path.join(process.cwd(), arg[0] || '.');
  if(fs
    .existsSync(repo) && fs
    .readdirSync(repo)
    .includes('mongover.json')) {
    console.log(chalk.yellow(`Warning: ${repo.replace(process.cwd(), '.')} is already a Mongover Repository`));
    return constants.exit.cannotExe;
  }
  const name = repo.split(path.sep).pop();
  const serverName = name + 'Server';
  const dbName = name + 'Db';
  const collectionName = name + 'Col';
  const indexName = name + 'Idx';
  const fieldName = name + 'Fld';
  fs.ensureDirSync(path.join(repo, 'data', dbName));
  const spec = {
    databases: {
      dbName: {
        collections: {
          collectionName: {
            fields: {
              fieldName: {
                type: 'string'
              }
            },
            options: {},
            upsertFields: [
              'fieldName'
            ],
            ignoreFields: [
              'fieldName'
            ],
            persistId: false,
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
        mongoUri: 'mongodb://user:password@127.0.0.1:27017/?authSource=admin',
        databases: [
          'dbName'
        ]
      }
    }
  };
  spec.databases[dbName] = spec.databases.dbName;
  delete spec.databases.dbName;
  spec.databases[dbName].collections[collectionName] = spec.databases[dbName].collections.collectionName;
  delete spec.databases[dbName].collections.collectionName;
  spec.databases[dbName].collections[collectionName].fields[fieldName] = spec.databases[dbName].collections[collectionName].fields.fieldName;
  delete spec.databases[dbName].collections[collectionName].fields.fieldName;
  spec.databases[dbName].collections[collectionName].upsertFields[0] = fieldName;
  spec.databases[dbName].collections[collectionName].ignoreFields[0] = fieldName;
  spec.databases[dbName].collections[collectionName].indexes[indexName] = spec.databases[dbName].collections[collectionName].indexes.indexName;
  delete spec.databases[dbName].collections[collectionName].indexes.indexName;
  spec.databases[dbName].collections[collectionName].indexes[indexName].keys[fieldName] = spec.databases[dbName].collections[collectionName].indexes[indexName].keys.fieldName;
  delete spec.databases[dbName].collections[collectionName].indexes[indexName].keys.fieldName;
  spec.servers[serverName] = spec.servers.serverName;
  delete spec.servers.serverName;
  spec.servers[serverName].databases[0] = dbName;
  fs.writeJSONSync(path.join(repo, 'mongover.json'), spec, {
    spaces: 2
  });
  fs.writeFileSync(path.join(repo, 'data', dbName, `${collectionName}.jsonl`), `{"_id":{"$oid":"aaaaaaaaaaaaaaaaaaaaaaaa"},"${fieldName}":"${name}"}\n`);
  console.log(chalk.green('Mongover Repository Initialized!'));
  return constants.exit.success;
};

module.exports = init;