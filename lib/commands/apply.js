const chalk = require('chalk');
const EJSON = require('mongodb-extended-json');
const fs = require('fs-extra');
const MongoClient = require('mongodb').MongoClient;
const path = require('path');
const requirer = require('../utils/requirer');

const constants = require('../utils/constants');
const dotNotate = require('../utils/dotNotate');

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
    if(fs
      .readdirSync(repo)
      .includes('mongover.json')) {
      spec = require(path.join(repo, 'mongover.json'));
    } else {
      spec = {
        databases: {},
        servers: {}
      };
      for(database of fs.readdirSync(path.join(repo, 'mongover', 'databases'))) {
        spec.databases[database] = {};
        spec.databases[database].collections = requirer(path.join(repo, 'mongover', 'databases', database));
      }
      spec.servers = requirer(path.join(repo, 'mongover', 'servers'));
    }
    await start();
    console.log(chalk.green('Mongover Specification Applied!'));
    return constants.exit.success;
  } catch (error) {
    console.log(chalk.red(`Error: ${error.message}`));
    return constants.exit.error;
  }
};

const start = async () => {
  try {
    for(serverName in spec.servers) {
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
    for(serverDatabase of server.databases) {
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
    for(colName in database.collections) {
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
    for(indexName in collection.indexes) {
      await buildIndex(indexName, collection.indexes[indexName], col);
    }
    console.log(`      Importing collection data`);
    for(dataFile of fs.readdirSync(dbDataPath)) {
      if(dataFile.split('.')[0] === colName) {
        const promises = fs
          .readFileSync(path.join(dbDataPath, dataFile))
          .toString()
          .split('\n')
          .map(async (data) => {
            await importData(data, collection, col);
          });
        await Promise.all(promises);
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

const importData = async (data, collection, col) => {
  try {
    if(data === '') {
      return;
    }
    const filterObj = {};
    const dataObj = EJSON.parse(data);
    let dataDotNotatedObj = {};
    dotNotate(dataObj, dataDotNotatedObj);
    collection.upsertFields.forEach((upsertField) => {
      filterObj[upsertField] = dataDotNotatedObj[upsertField];
    });
    if(!collection.preserveObjectId) {
      delete dataDotNotatedObj._id;
    }
    let existingCount = await col.countDocuments(filterObj);
    if(existingCount > 0) {
      collection.ignoreFields.forEach((ignoreField) => {
        Object
          .keys(dataDotNotatedObj)
          .forEach((dataDotNotatedKey) => {
            if(dataDotNotatedKey.startsWith(ignoreField)) {
              delete dataDotNotatedObj[dataDotNotatedKey];
            }
          });
      });
    }
    if(Object.keys(dataDotNotatedObj).length > 0) {
      if(existingCount > 0) {
        try {
          await col.updateMany(filterObj, { $set: dataDotNotatedObj }, { upsert: true });
        } catch (error) {
          console.log(chalk.yellow(`Warning: ${error.message}`));
        }
      } else {
        try {
          await col.insertOne(dataDotNotatedObj);
        } catch (error) {
          console.log(chalk.yellow(`Warning: ${error.message}`));
        }
      }
    }
    return Promise.resolve();
  } catch (error) {
    return Promise.reject(error);
  }
};

module.exports = apply;