const _ = require('lodash');
const EJSON = require('mongodb-extended-json');
const fs = require('fs-extra');
const MongoClient = require('mongodb').MongoClient;
const path = require('path');
const chalk = require('chalk');

const constants = require('../utils/constants');
const writeJsonSpec = require('../utils/writeJsonSpec');
const writeDirSpec = require('../utils/writeDirSpec');
const parseLongOptions = require('../utils/parseLongOptions');

const extract = async (args) => {
  let conn;
  try {
    const repo = path.join(process.cwd(), args._[0] || '.');
    if(fs
      .existsSync(repo) && (fs
      .readdirSync(repo)
      .includes('mongover.json') || fs
      .readdirSync(repo)
      .includes('mongover'))) {
      console.log(chalk.yellow(`Warning: ${repo.replace(process.cwd(), '.')} is already a Mongover Repository`));
      return constants.exit.cannotExe;
    }
    parseLongOptions(args);
    if(!args.host) {
      args.host = '127.0.0.1:27017';
    }
    if(!args.db) {
      throw new Error('Error: Please specify databases using --db option');
    }
    let spec = {
      databases: {},
      servers: {}
    };
    let mongoUri = 'mongodb://'
    if(args.username || args.password) {
      mongoUri += `${args.username}:${args.password}@`;
    }
    mongoUri += args.host + '/';
    if(args.authsource) {
      mongoUri += `?authsource=${args.authsource}`;
    }
    conn = await MongoClient.connect(mongoUri, { useNewUrlParser: true });
    const dbNames = args.db.split(',');
    spec.servers.server = {
      mongoUri: mongoUri,
      databases: dbNames
    };
    let colNames;
    if(args.collection) {
      colNames = args.collection.split(',');
    }
    let db, collections, indexes, data;
    for(dbName of dbNames) {
      spec.databases[dbName] = {
        collections: {},
        dropFirst: false
      };
      db = await conn.db(dbName);
      let filter = {};
      if(colNames) {
        filter.name = {
          $in: colNames
        };
      }
      collections = await db.listCollections(filter).toArray();
      for(collection of collections) {
        spec.databases[dbName].collections[collection.name] = {
          options: collection.options,
          upsertFields: [],
          ignoreFields: [],
          preserveObjectId: false,
          dropIndexesFirst: false,
          indexes: {},
          dropFirst: false
        };
        indexes = await db
          .collection(collection.name)
          .listIndexes()
          .toArray();
        for(index of indexes) {
          if(index.name !== '_id_') {
            spec.databases[dbName].collections[collection.name].indexes[index.name] = {
              keys: index.key,
              options: _.omit(index, ['key','v','name','ns']),
              dropFirst: false
            }
          } 
        }
        if(args.data !== 'no') {
          fs.ensureDirSync(path.join(repo, 'data', dbName));
          data = await db
            .collection(collection.name)
            .find()
            .toArray();
          for(d of data) {
            fs.appendFileSync(path.join(repo, 'data', dbName, `${collection.name}.jsonl`), EJSON.stringify(d) + '\n');
          }
        }
      }
    }
    switch(args.format){
      case 'dir':
        writeDirSpec(repo, spec);
        break;
      default:
        writeJsonSpec(repo, spec);
    }
    await conn.close();
    console.log(chalk.green('Mongover Specification Extracted and Repository Initialized!'));
    return constants.exit.success;
  } catch(error) {
    console.log(chalk.red(`Error: ${error.message}`));
    if(conn) {
      await conn.close();
    }
    return constants.exit.error;
  }
};

module.exports = extract;