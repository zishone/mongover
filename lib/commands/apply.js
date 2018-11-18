const chalk = require('chalk');
const EJSON = require('mongodb-extended-json');
const fs = require('fs-extra');
const MongoClient = require('mongodb').MongoClient;
const path = require('path');
const readline = require('readline');

const constants = require('../utils/constants');
const requireMany = require('../utils/requireMany');
const dotNotate = require('../utils/dotNotate');
const parseLongOptions = require('../utils/parseLongOptions');

let repo, spec;

const apply = async (args) => {
  try {
    repo = path.join(process.cwd(), args._[0] || '.');
    if(!(fs
      .readdirSync(repo)
      .includes('mongover.json') || fs
      .readdirSync(repo)
      .includes('mongover'))) {
      console.log(chalk.yellow(`Warning: ${repo.replace(process.cwd(), './')} is not a Mongover Repository`));
      return constants.exit.cannotExe;
    }
    parseLongOptions(args);
    spec = getSpec(args);
    await start();
    console.log(chalk.green('Mongover Specification Applied!'));
    return constants.exit.success;
  } catch (error) {
    console.log(chalk.red(`Error: ${error.message}`));
    return constants.exit.error;
  }
};

const getSpec = (args) => {
  let spec;
  let temp = {
    databases: {},
    servers: {}
  };
  if(fs
    .readdirSync(repo)
    .includes('mongover.json')) {
    spec = require(path.join(repo, 'mongover.json'));
  } else {
    spec = {
      databases: {},
      servers: {}
    };
    for(let database of fs.readdirSync(path.join(repo, 'mongover', 'databases'))) {
      spec.databases[database] = {};
      spec.databases[database].collections = requireMany(path.join(repo, 'mongover', 'databases', database));
    }
    spec.servers = requireMany(path.join(repo, 'mongover', 'servers'));
  }

  if(args.server) {
    for(let serverName of args.server.split(',')) {
      if(!spec.servers[serverName]) {
        throw new Error(`${serverName} server was not defined in Mongover Specification`);
      }
      temp.servers[serverName] = spec.servers[serverName]
    }
  } else if(args.host) {
    let mongoUri = 'mongodb://'
    if(args.username || args.password) {
      mongoUri += `${args.username}:${args.password}@`;
    }
    mongoUri += args.host + '/';
    if(args.authsource) {
      mongoUri += `?authsource=${args.authsource}`;
    }
    temp.servers[args.host] = {
      mongoUri: mongoUri
    };
    if(!args.db) {
      temp.servers[args.host].databases = Object.keys(spec.databases);
    }
  } else {
    temp.servers = spec.servers;
  }

  if(args.db) {
    let asOpt = [];
    if(args.as) {
      asOpt = args.as .split(',');
    }
    for(let serverName in temp.servers) {
      temp.servers[serverName].databases = [];
      let dbNames = args.db.split(',');
      for(let i in dbNames) {
        if(!spec.databases[dbNames[i]]) {
          throw new Error(`${dbNames[i]} database was not defined in Mongover Specification`);
        }
        temp.databases[dbNames[i]] = spec.databases[dbNames[i]];
        let dbObj = {
          db: dbNames[i]
        };
        if(asOpt[i] && asOpt[i].length > 0) {
          dbObj.as = asOpt[i];
        }
        temp.servers[serverName].databases.push(dbObj);
      }
    }
  } else {
    temp.databases = spec.databases;
  }

  if(args.collection) {
    let collections = args.collection.split(',');
    for(let dbName in temp.databases) {
      for(let collection in collections) {
        temp.databases[dbName].collections[collection] = temp.databases[dbName].collections[collection];
      }
    }
  }
  spec = temp;
  return spec;
};

const start = async () => {
  try {
    for(let serverName in spec.servers) {
      await connectServer(serverName, spec.servers[serverName]);
    }
    return Promise.resolve();
  } catch (error) {
    return Promise.reject(error);
  }
};

const connectServer = async (serverName, server) => {
  let conn;
  try {
    console.log(`Connecting to ${chalk.cyan(serverName)} server`);
    conn = await MongoClient.connect(server.mongoUri, { useNewUrlParser: true });
    for(let serverDatabase of server.databases) {
      let dbName, database, dbDataPath;
      if(typeof serverDatabase === 'object') {
        dbName = serverDatabase.as || serverDatabase.db;
        database = spec.databases[serverDatabase.db];
        dbDataPath = path.join(repo, 'data', serverDatabase.db);
      } else {
        dbName = serverDatabase;
        database = spec.databases[serverDatabase];
        dbDataPath = path.join(repo, 'data', serverDatabase);
      }
      await structureDatabase(dbName, database, conn.db(dbName), dbDataPath);
    }
    await conn.close();
    return Promise.resolve();
  } catch (error) {
    if(conn) {
      await conn.close();
    }
    return Promise.reject(error);
  }
};

const structureDatabase = async (dbName, database, db, dbDataPath) => {
  try {
    console.log(`  Structuring ${chalk.cyan(dbName)} database`);
    if(database.dropFirst) {
      await db.dropDatabase();
    }
    if(Object.keys(database.collections).length === 0) {
      console.log(chalk.yellow(`Warning: ${dbName} does not contain any collection`));
    }
    for(let colName in database.collections) {
      await createCollection(colName, database.collections[colName], db, dbDataPath);
    }
    return Promise.resolve();
  } catch (error) {
    return Promise.reject(error);
  }
};

const createCollection = async (colName, collection, db, dbDataPath) => {
  try {
    console.log(`    Creating ${chalk.cyan(colName)} collection`);
    const col = db.collection(colName);
    const existing = await db
        .listCollections({ name: colName })
        .toArray();
    if(collection.dropFirst && existing[0]) {
      await db.dropCollection(colName);
    } else if(collection.dropIndexesFirst && existing[0]) {
      await col.dropIndexes();
    }
    await db.createCollection(colName, collection.options || {});
    for(let indexName in collection.indexes) {
      await buildIndex(indexName, collection.indexes[indexName], col);
    }
    console.log(`      Importing collection data`);
    for(let dataFile of fs.readdirSync(dbDataPath)) {
      if(dataFile.split('.')[0] === colName) {
        const stream = readline.createInterface({ input: fs.createReadStream(path.join(dbDataPath, dataFile)) });
        await importData(stream, collection, col);
        break;
      }
    }
    return Promise.resolve();
  } catch (error) {
    return Promise.reject(error);
  }
};

const buildIndex = async (indexName, index, col) => {
  try {
    console.log(`      Building ${chalk.cyan(indexName)} index`);
    const existing = await col.indexExists(indexName);
    if(index.dropFirst && existing) {
      await col.dropIndex(indexName);
    }
    index.options.name = indexName;
    try {
      await col.createIndex(index.keys, index.options);
    } catch (error) {
      console.log(chalk.yellow(`Warning: ${error.message}`));
    }
    return Promise.resolve();
  } catch (error) {
    return Promise.reject(error);
  }
};

const importData = (stream, collection, col) => {
  return new Promise((resolve, reject) => {
    stream
      .on('line', async (data) => {
        try {
          stream.pause();
          const filterObj = {};
          const dataObj = EJSON.parse(data.toString());
          let dataDotNotatedObj = {};
          dotNotate(dataObj, dataDotNotatedObj);
          for(let upsertField of collection.upsertFields) {
            filterObj[upsertField] = dataDotNotatedObj[upsertField];
          }
          if(!collection.preserveObjectId) {
            delete dataDotNotatedObj._id;
            delete dataObj._id;
          }
          let existingCount = await col.countDocuments(filterObj);
          if(existingCount > 0) {
            for(let ignoreField of collection.ignoreFields) {
              for(let dataDotNotatedKey in dataDotNotatedObj) {
                if(dataDotNotatedKey.startsWith(ignoreField)) {
                  delete dataDotNotatedObj[dataDotNotatedKey];
                }
              }
            }
            if(Object.keys(dataDotNotatedObj).length > 0) {
              try {
                await col.updateMany(filterObj, { $set: dataDotNotatedObj }, { upsert: true });
              } catch (error) {
                console.log(chalk.yellow(`Warning: ${error.message}`));
              }
            }
          } else {
            if(Object.keys(dataObj).length > 0) {
              try {
                await col.insertOne(dataObj);
              } catch (error) {
                console.log(chalk.yellow(`Warning: ${error.message}`));
              }
            }
          }
          stream.resume();
        } catch (error) {
          return reject(error);
        }
      })
      .on('close', () => {
        return resolve();
      })
      .on('error', (error) => {
        return reject(error);
      });
  });
};

module.exports = apply;