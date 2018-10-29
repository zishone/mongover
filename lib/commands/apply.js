const chalk = require('chalk');
const EJSON = require('mongodb-extended-json');
const fs = require('fs-extra');
const glob = require('glob');
const MongoClient = require('mongodb').MongoClient;
const path = require('path');

const constants = require('../utils/constants');
const dotNotate = require('../utils/dotNotate');

let repo, spec;

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
    await Promise.all(promises);
    return Promise.resolve();
  } catch (error) {
    return Promise.reject(error);
  }
};

const connectServer = async (serverName) => {
  let conn;
  try {
    console.log(`Connecting to ${chalk.cyan(serverName)} server`);
    conn = await MongoClient.connect(spec.servers[serverName].mongoUri, { useNewUrlParser: true });
    const promises = spec.servers[serverName].databases.map(async (dbName) => { 
      await structureDatabase(dbName, spec.databases[dbName], conn.db(dbName));
    });
    await Promise.all(promises);
    await conn.close();
    return Promise.resolve();
  } catch (error) {
    if(conn) {
      await conn.close();
    }
    return Promise.reject(error);
  }
};

const structureDatabase = async (dbName, database, db) => {
  try {
    console.log(`  Structuring ${chalk.cyan(dbName)} database`);
    if(database.dropFirst) {
      await db.dropDatabase();
    }
    const promises = Object
      .keys(database.collections)
      .map(async (colName) => {
        await createCollection(colName, database.collections[colName], db, path.join(repo, 'data', dbName));
      });
    await Promise.all(promises);
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
    const promises = Object
      .keys(collection.indexes)
      .map(async (indexName) => {
        await buildIndex(indexName, collection.indexes[indexName], col);
      });
    await Promise.all(promises);
    await new Promise((resolve, reject) => {
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
            .map(async (data) => {
              await importData(data, collection, col);
            });
          resolve(Promise.all(promises));
        }
      });
    });
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