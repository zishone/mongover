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
    console.log(chalk.yellow(`Warning: ${repo.replace(process.cwd(), './')} is already a Mongover Repository`));
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
              fieldNameStr: {
                type: 'string'
              },
              fieldNameNum: {
                type: 'number'
              },
              fieldNameBool: {
                type: 'boolean'
              },
              fieldNameObj: {
                type: 'object',
                fields: {}
              },
              fieldNameArr: {
                type: 'array',
                items: {
                  type: 'any'
                }
              },
              fieldNameStrNumBoolObjArrNull: {
                type: [
                  'string',
                  'number',
                  'boolean',
                  'object',
                  'array',
                  'null'
                ],
                fields: {},
                items: {
                  type: 'any'
                }
              },
              fieldNameAny: {
                type: 'any'
              },
              fieldNameNull: {
                type: 'null'
              }
            },
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

  spec.databases[dbName].collections[collectionName].fields[fieldName + "Str"] = spec.databases[dbName].collections[collectionName].fields.fieldNameStr;
  delete spec.databases[dbName].collections[collectionName].fields.fieldNameStr;

  spec.databases[dbName].collections[collectionName].fields[fieldName + "Num"] = spec.databases[dbName].collections[collectionName].fields.fieldNameNum;
  delete spec.databases[dbName].collections[collectionName].fields.fieldNameNum;

  spec.databases[dbName].collections[collectionName].fields[fieldName + "Bool"] = spec.databases[dbName].collections[collectionName].fields.fieldNameBool;
  delete spec.databases[dbName].collections[collectionName].fields.fieldNameBool;

  spec.databases[dbName].collections[collectionName].fields[fieldName + "Obj"] = spec.databases[dbName].collections[collectionName].fields.fieldNameObj;
  delete spec.databases[dbName].collections[collectionName].fields.fieldNameObj;

  spec.databases[dbName].collections[collectionName].fields[fieldName + "Obj"].fields[fieldName + "Any"] = spec.databases[dbName].collections[collectionName].fields[fieldName + "Obj"].fields.fieldNameAny;
  delete spec.databases[dbName].collections[collectionName].fields[fieldName + "Obj"].fields.fieldNameAny;
  
  spec.databases[dbName].collections[collectionName].fields[fieldName + "StrNumBoolObjArrNull"] = spec.databases[dbName].collections[collectionName].fields.fieldNameStrNumBoolObjArrNull;
  delete spec.databases[dbName].collections[collectionName].fields.fieldNameStrNumBoolObjArrNull;
  
  spec.databases[dbName].collections[collectionName].fields[fieldName + "StrNumBoolObjArrNull"].fields[fieldName + "Any"] = spec.databases[dbName].collections[collectionName].fields[fieldName + "StrNumBoolObjArrNull"].fields.fieldNameAny;
  delete spec.databases[dbName].collections[collectionName].fields[fieldName + "StrNumBoolObjArrNull"].fields.fieldNameAny;

  spec.databases[dbName].collections[collectionName].fields[fieldName + "Any"] = spec.databases[dbName].collections[collectionName].fields.fieldNameAny;
  delete spec.databases[dbName].collections[collectionName].fields.fieldNameAny;

  spec.databases[dbName].collections[collectionName].fields[fieldName + "Null"] = spec.databases[dbName].collections[collectionName].fields.fieldNameNull;
  delete spec.databases[dbName].collections[collectionName].fields.fieldNameNull;

  spec.databases[dbName].collections[collectionName].fields[fieldName + "Arr"] = spec.databases[dbName].collections[collectionName].fields.fieldNameArr;
  delete spec.databases[dbName].collections[collectionName].fields.fieldNameArr;

  spec.databases[dbName].collections[collectionName].upsertFields[0] = fieldName + "Str";
  spec.databases[dbName].collections[collectionName].ignoreFields[0] = fieldName + "Str";
  spec.databases[dbName].collections[collectionName].indexes[indexName] = spec.databases[dbName].collections[collectionName].indexes.indexName;
  delete spec.databases[dbName].collections[collectionName].indexes.indexName;

  spec.databases[dbName].collections[collectionName].indexes[indexName].keys[fieldName + "Str"] = spec.databases[dbName].collections[collectionName].indexes[indexName].keys.fieldName;
  delete spec.databases[dbName].collections[collectionName].indexes[indexName].keys.fieldName;

  spec.servers[serverName] = spec.servers.serverName;
  delete spec.servers.serverName;

  spec.servers[serverName].databases[0] = dbName;

  fs.writeJSONSync(path.join(repo, 'mongover.json'), spec, {
    spaces: 2
  });
  fs.writeFileSync(path.join(repo, 'data', dbName, `${collectionName}.jsonl`), `{"_id":{"$oid":"aaaaaaaaaaaaaaaaaaaaaaaa"},"${fieldName}Str":"${name}","${fieldName}Num":1,"${fieldName}Bool":true,"${fieldName}Obj":{},"${fieldName}Arr":[],"${fieldName}StrNumBoolObjArrNull":"anyOfStrNumBoolObjArrNull","${fieldName}Any":"anyDataType","${fieldName}Null":null}\n`);
  console.log(chalk.green('Mongover Repository Initialized!'));
  return constants.exit.success;
};

module.exports = init;