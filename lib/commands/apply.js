const chalk = require('chalk');
const EJSON = require('mongodb-extended-json');
const fs = require('fs-extra');
const glob = require('glob');
const MongoClient = require('mongodb').MongoClient;
const path = require('path');

const constants = require('../utils/constants');
const dotNotate = require('../utils/dotNotate');

let repo, spec, server, database, collection, index, conn, db, col, dbDataPath;

const apply = async (arg) => {
  repo = path.join(process.cwd(), arg[0] || '.');
  try {
    if(!fs
      .readdirSync(repo)
      .includes('mongover.json')) {
      console.log(chalk.yellow(`Warning: ${repo.replace(process.cwd(), './')} is not a Mongover Repository`));
      return constants.exit.cannotExe;
    }
    spec = require(path.join(repo, 'mongover.json'));
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
    const promises = Object
      .keys(spec.servers)
      .map(connectServer);
    return Promise.all(promises);
  } catch (error) {
    return Promise.reject(error);
  }
};

const connectServer = async (serverName) => {
  try {
    console.log(`Connecting to ${chalk.cyan(serverName)} server`);
    server = spec.servers[serverName];
    conn = await MongoClient.connect(server.mongoUri, { useNewUrlParser: true });
    const promises = server.databases.map(structureDatabase);
    await Promise.all(promises);
    return conn.close();
  } catch (error) {
    await conn.close();
    return Promise.reject(error);
  }
};

const structureDatabase = async (dbName) => {
  try {
    console.log(`  Structuring ${chalk.cyan(dbName)} database`);
    database = spec.databases[dbName];
    db = conn.db(dbName);
    dbDataPath = path.join(repo, 'data', dbName);
    if(database.dropFirst) {
      await db.dropDatabase();
    }
    const promises = Object
      .keys(database.collections)
      .map(createCollection);
    return Promise.all(promises);
  } catch (error) {
    return Promise.reject(error);
  }
};

const createCollection = async (colName) => {
  try {
    console.log(`    Creating ${chalk.cyan(colName)} collection`);
    collection = database.collections[colName];
    col = db.collection(colName);
    const existing = await db
        .listCollections({ name: colName })
        .toArray();
    if(collection.dropFirst && existing[0]) {
      await db.dropCollection(colName);
    } else if(collection.dropIndexesFirst && existing[0]) {
      await col.dropIndexes();
    }
    await db.createCollection(colName, collection.options || {});
    const promises = Object
      .keys(collection.indexes)
      .map(buildIndex);
    return Promise.all(promises)
      .then(() => {
        return new Promise((resolve, reject) => {
          glob(path.join(dbDataPath, `${colName}*`), (error, dataFileArr) => {
            if(error) {
              throw error;
            }
            if(dataFileArr.length > 0) {
              const dataFile = dataFileArr[0];
              console.log(`      Importing ${chalk.cyan(dataFile.replace(path.join(repo, 'data', '/'), ''))} data`);
              const promises = fs
                .readFileSync(dataFile)
                .toString()
                .split('\n')
                .map(importData);
              resolve(Promise.all(promises));
            }
          });
        });
      });
  } catch (error) {
    return Promise.reject(error);
  }
};

const buildIndex = async (indexName) => {
  try {
    console.log(`      Building ${chalk.cyan(indexName)} index`);
    index = collection.indexes[indexName];
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

const importData = async (data) => {
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
            if(dataDotNotatedKey.includes(ignoreField)) {
              delete dataDotNotatedObj[dataDotNotatedKey];
            }
          });
      });
    }
    if(Object.keys(filterObj).length > 0) {
      try {
        if(Object.keys(dataDotNotatedObj).length > 0) {
          await col.updateMany(filterObj, { $set: dataDotNotatedObj }, { upsert: true });
        }
      } catch (error) {
        console.log(chalk.yellow(`Warning: ${error.message}`));
      }
    } else {
      try {
        await col.insertOne(dataObj);
      } catch (error) {
        console.log(chalk.yellow(`Warning: ${error.message}`));
      }
    }
    return Promise.resolve();
  } catch (error) {
    return Promise.reject(error);
  }
};

module.exports = apply;