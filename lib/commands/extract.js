const _ = require('lodash');
const EJSON = require('mongodb-extended-json');
const fs = require('fs-extra');
const MongoClient = require('mongodb').MongoClient;
const path = require('path');
const chalk = require('chalk');

const constants = require('../utils/constants');

const extract = async (args) => {
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
    if(!args.host) {
      throw new Error('Error: Please specify host using --host option');
    }
    if(!args.db) {
      throw new Error('Error: Please specify databases using --db option');
    }
    let spec = {
      databases: {},
      servers: {}
    };
    let mongoUri = 'mongodb://'
    if(args.user || args.password) {
      mongoUri += `${args.user}:${args.password}@`;
    }
    mongoUri += args.host + '/';
    if(args.authsource) {
      mongoUri += `?authsource=${args.authsource}`;
    }
    const conn = await MongoClient.connect(mongoUri, { useNewUrlParser: true });
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
        collections: {}
      };
      fs.ensureDirSync(path.join(repo, 'data', dbName));
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
        if(!args.noData) {
          let query = {};
          if(args.query) {
            query = EJSON.parse(args.query);
          }
          data = await db
            .collection(collection.name)
            .find(query)
            .toArray();
          for(d of data) {
            fs.appendFileSync(path.join(repo, 'data', dbName, `${collection.name}.jsonl`), EJSON.stringify(d) + '\n');
          }
        }
      }
      if(Object.keys(spec.databases[dbName].collections).length === 0) {
        delete spec.databases[dbName];
        fs.rmdirSync(path.join(repo, 'data', dbName));
      } else {
        spec.databases[dbName].dropFirst = false;
      }
    }
    switch(args.spec){
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
    return constants.exit.error;
  }
};

const writeJsonSpec = (repo, spec) => {
  fs.writeJSONSync(path.join(repo, 'mongover.json'), spec, {
    spaces: 2
  });
};

const writeDirSpec = (repo, spec) => {
  for(dbName in spec.databases) {
    fs.ensureDirSync(path.join(repo, 'mongover', 'databases', dbName));
    for(colName in spec.databases[dbName].collections) {
      fs.writeJsonSync(path.join(repo, 'mongover', 'databases', dbName, `${colName}.json`), spec.databases[dbName].collections[colName], {
        spaces: 2
      });
    }
  }
  fs.ensureDirSync(path.join(repo, 'mongover', 'servers'));
  for(serverName in spec.servers) {
    fs.writeJSONSync(path.join(repo, 'mongover', 'servers', `${serverName}.json`), spec.servers[serverName], {
      spaces: 2
    });
  }
};
module.exports = extract;