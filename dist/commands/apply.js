"use strict";

function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(_next, _throw); } }

function _asyncToGenerator(fn) { return function () { var self = this, args = arguments; return new Promise(function (resolve, reject) { var gen = fn.apply(self, args); function _next(value) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value); } function _throw(err) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err); } _next(undefined); }); }; }

const _ = require('lodash');

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

const apply =
/*#__PURE__*/
function () {
  var _ref = _asyncToGenerator(function* (args) {
    try {
      repo = path.join(process.cwd(), args._[0] || '.');

      if (!(fs.readdirSync(repo).includes('mongover.json') || fs.readdirSync(repo).includes('mongover'))) {
        console.log(chalk.yellow(`Warning: ${repo.replace(process.cwd(), './')} is not a Mongover Repository`));
        return constants.exit.cannotExe;
      }

      parseLongOptions(args);
      spec = getSpec(args);
      yield start();
      console.log(chalk.green('Mongover Specification Applied!'));
      return constants.exit.success;
    } catch (error) {
      console.log(chalk.red(`Error: ${error.message}`));
      return constants.exit.error;
    }
  });

  return function apply(_x) {
    return _ref.apply(this, arguments);
  };
}();

const getSpec = args => {
  let spec;
  let temp = {
    databases: {},
    servers: {}
  };

  if (fs.readdirSync(repo).includes('mongover.json')) {
    spec = require(path.join(repo, 'mongover.json'));
  } else {
    spec = {
      databases: {},
      servers: {}
    };
    var _iteratorNormalCompletion = true;
    var _didIteratorError = false;
    var _iteratorError = undefined;

    try {
      for (var _iterator = fs.readdirSync(path.join(repo, 'mongover', 'databases'))[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
        let database = _step.value;
        spec.databases[database] = {};
        spec.databases[database].collections = requireMany(path.join(repo, 'mongover', 'databases', database));
      }
    } catch (err) {
      _didIteratorError = true;
      _iteratorError = err;
    } finally {
      try {
        if (!_iteratorNormalCompletion && _iterator.return != null) {
          _iterator.return();
        }
      } finally {
        if (_didIteratorError) {
          throw _iteratorError;
        }
      }
    }

    spec.servers = requireMany(path.join(repo, 'mongover', 'servers'));
  }

  if (args.server) {
    var _iteratorNormalCompletion2 = true;
    var _didIteratorError2 = false;
    var _iteratorError2 = undefined;

    try {
      for (var _iterator2 = args.server.split(',')[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
        let serverName = _step2.value;

        if (!spec.servers[serverName]) {
          throw new Error(`${serverName} server was not defined in Mongover Specification`);
        }

        temp.servers[serverName] = spec.servers[serverName];
      }
    } catch (err) {
      _didIteratorError2 = true;
      _iteratorError2 = err;
    } finally {
      try {
        if (!_iteratorNormalCompletion2 && _iterator2.return != null) {
          _iterator2.return();
        }
      } finally {
        if (_didIteratorError2) {
          throw _iteratorError2;
        }
      }
    }
  } else if (args.host) {
    let mongoUri = 'mongodb://';

    if (args.username || args.password) {
      mongoUri += `${args.username}:${args.password}@`;
    }

    mongoUri += args.host + '/';

    if (args.authsource) {
      mongoUri += `?authsource=${args.authsource}`;
    }

    temp.servers[args.host] = {
      mongoUri: mongoUri
    };

    if (!args.db) {
      temp.servers[args.host].databases = Object.keys(spec.databases);
    }
  } else {
    temp.servers = spec.servers;
  }

  if (args.db) {
    let asOpt = [];

    if (args.as) {
      asOpt = args.as.split(',');
    }

    for (let serverName in temp.servers) {
      temp.servers[serverName].databases = [];
      let dbNames = args.db.split(',');

      for (let i in dbNames) {
        if (!spec.databases[dbNames[i]]) {
          throw new Error(`${dbNames[i]} database was not defined in Mongover Specification`);
        }

        temp.databases[dbNames[i]] = spec.databases[dbNames[i]];
        let dbObj = {
          db: dbNames[i]
        };

        if (asOpt[i] && asOpt[i].length > 0) {
          dbObj.as = asOpt[i];
        }

        temp.servers[serverName].databases.push(dbObj);
      }
    }
  } else {
    temp.databases = spec.databases;
  }

  if (args.collection) {
    let collections = args.collection.split(',');

    for (let dbName in temp.databases) {
      temp.databases[dbName].collections = _.pick(temp.databases[dbName].collections, collections);
    }
  }

  spec = temp;
  return spec;
};

const start =
/*#__PURE__*/
function () {
  var _ref2 = _asyncToGenerator(function* () {
    try {
      for (let serverName in spec.servers) {
        yield connectServer(serverName, spec.servers[serverName]);
      }

      return Promise.resolve();
    } catch (error) {
      return Promise.reject(error);
    }
  });

  return function start() {
    return _ref2.apply(this, arguments);
  };
}();

const connectServer =
/*#__PURE__*/
function () {
  var _ref3 = _asyncToGenerator(function* (serverName, server) {
    let conn;

    try {
      console.log(`Connecting to ${chalk.cyan(serverName)} server`);
      conn = yield MongoClient.connect(server.mongoUri, {
        useNewUrlParser: true
      });
      var _iteratorNormalCompletion3 = true;
      var _didIteratorError3 = false;
      var _iteratorError3 = undefined;

      try {
        for (var _iterator3 = server.databases[Symbol.iterator](), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
          let serverDatabase = _step3.value;
          let dbName, database, dbDataPath;

          if (typeof serverDatabase === 'object') {
            dbName = serverDatabase.as || serverDatabase.db;
            database = spec.databases[serverDatabase.db];
            dbDataPath = path.join(repo, 'data', serverDatabase.db);
          } else {
            dbName = serverDatabase;
            database = spec.databases[serverDatabase];
            dbDataPath = path.join(repo, 'data', serverDatabase);
          }

          yield structureDatabase(dbName, database, conn.db(dbName), dbDataPath);
        }
      } catch (err) {
        _didIteratorError3 = true;
        _iteratorError3 = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion3 && _iterator3.return != null) {
            _iterator3.return();
          }
        } finally {
          if (_didIteratorError3) {
            throw _iteratorError3;
          }
        }
      }

      yield conn.close();
      return Promise.resolve();
    } catch (error) {
      if (conn) {
        yield conn.close();
      }

      return Promise.reject(error);
    }
  });

  return function connectServer(_x2, _x3) {
    return _ref3.apply(this, arguments);
  };
}();

const structureDatabase =
/*#__PURE__*/
function () {
  var _ref4 = _asyncToGenerator(function* (dbName, database, db, dbDataPath) {
    try {
      console.log(`  Structuring ${chalk.cyan(dbName)} database`);

      if (database.dropFirst) {
        yield db.dropDatabase();
      }

      if (Object.keys(database.collections).length === 0) {
        console.log(chalk.yellow(`Warning: ${dbName} does not contain any collection`));
      }

      for (let colName in database.collections) {
        yield createCollection(colName, database.collections[colName], db, dbDataPath);
      }

      return Promise.resolve();
    } catch (error) {
      return Promise.reject(error);
    }
  });

  return function structureDatabase(_x4, _x5, _x6, _x7) {
    return _ref4.apply(this, arguments);
  };
}();

const createCollection =
/*#__PURE__*/
function () {
  var _ref5 = _asyncToGenerator(function* (colName, collection, db, dbDataPath) {
    try {
      console.log(`    Creating ${chalk.cyan(colName)} collection`);
      const col = db.collection(colName);
      const existing = yield db.listCollections({
        name: colName
      }).toArray();

      if (collection.dropFirst && existing[0]) {
        yield db.dropCollection(colName);
      } else if (collection.dropIndexesFirst && existing[0]) {
        yield col.dropIndexes();
      }

      yield db.createCollection(colName, collection.options || {});

      for (let indexName in collection.indexes) {
        yield buildIndex(indexName, collection.indexes[indexName], col);
      }

      console.log(`      Importing collection data`);
      var _iteratorNormalCompletion4 = true;
      var _didIteratorError4 = false;
      var _iteratorError4 = undefined;

      try {
        for (var _iterator4 = fs.readdirSync(dbDataPath)[Symbol.iterator](), _step4; !(_iteratorNormalCompletion4 = (_step4 = _iterator4.next()).done); _iteratorNormalCompletion4 = true) {
          let dataFile = _step4.value;

          if (dataFile.split('.')[0] === colName) {
            const stream = readline.createInterface({
              input: fs.createReadStream(path.join(dbDataPath, dataFile))
            });
            yield importData(stream, collection, col);
            break;
          }
        }
      } catch (err) {
        _didIteratorError4 = true;
        _iteratorError4 = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion4 && _iterator4.return != null) {
            _iterator4.return();
          }
        } finally {
          if (_didIteratorError4) {
            throw _iteratorError4;
          }
        }
      }

      return Promise.resolve();
    } catch (error) {
      return Promise.reject(error);
    }
  });

  return function createCollection(_x8, _x9, _x10, _x11) {
    return _ref5.apply(this, arguments);
  };
}();

const buildIndex =
/*#__PURE__*/
function () {
  var _ref6 = _asyncToGenerator(function* (indexName, index, col) {
    try {
      console.log(`      Building ${chalk.cyan(indexName)} index`);
      const existing = yield col.indexExists(indexName);

      if (index.dropFirst && existing) {
        yield col.dropIndex(indexName);
      }

      index.options.name = indexName;

      try {
        yield col.createIndex(index.keys, index.options);
      } catch (error) {
        console.log(chalk.yellow(`Warning: ${error.message}`));
      }

      return Promise.resolve();
    } catch (error) {
      return Promise.reject(error);
    }
  });

  return function buildIndex(_x12, _x13, _x14) {
    return _ref6.apply(this, arguments);
  };
}();

const importData = (stream, collection, col) => {
  return new Promise((resolve, reject) => {
    stream.on('line',
    /*#__PURE__*/
    function () {
      var _ref7 = _asyncToGenerator(function* (data) {
        try {
          stream.pause();
          const filterObj = {};
          const dataObj = EJSON.parse(data.toString());
          let dataDotNotatedObj = {};
          dotNotate(dataObj, dataDotNotatedObj);
          var _iteratorNormalCompletion5 = true;
          var _didIteratorError5 = false;
          var _iteratorError5 = undefined;

          try {
            for (var _iterator5 = collection.upsertFields[Symbol.iterator](), _step5; !(_iteratorNormalCompletion5 = (_step5 = _iterator5.next()).done); _iteratorNormalCompletion5 = true) {
              let upsertField = _step5.value;
              filterObj[upsertField] = dataDotNotatedObj[upsertField];
            }
          } catch (err) {
            _didIteratorError5 = true;
            _iteratorError5 = err;
          } finally {
            try {
              if (!_iteratorNormalCompletion5 && _iterator5.return != null) {
                _iterator5.return();
              }
            } finally {
              if (_didIteratorError5) {
                throw _iteratorError5;
              }
            }
          }

          if (!collection.preservePrimaryKey) {
            delete dataDotNotatedObj._id;
            delete dataObj._id;
          }

          let existingCount = 0;

          if (Object.keys(filterObj).length > 0) {
            existingCount = yield col.countDocuments(filterObj);
          }

          if (existingCount > 0) {
            var _iteratorNormalCompletion6 = true;
            var _didIteratorError6 = false;
            var _iteratorError6 = undefined;

            try {
              for (var _iterator6 = collection.ignoreFields[Symbol.iterator](), _step6; !(_iteratorNormalCompletion6 = (_step6 = _iterator6.next()).done); _iteratorNormalCompletion6 = true) {
                let ignoreField = _step6.value;

                for (let dataDotNotatedKey in dataDotNotatedObj) {
                  if (dataDotNotatedKey.startsWith(ignoreField)) {
                    delete dataDotNotatedObj[dataDotNotatedKey];
                  }
                }
              }
            } catch (err) {
              _didIteratorError6 = true;
              _iteratorError6 = err;
            } finally {
              try {
                if (!_iteratorNormalCompletion6 && _iterator6.return != null) {
                  _iterator6.return();
                }
              } finally {
                if (_didIteratorError6) {
                  throw _iteratorError6;
                }
              }
            }

            if (Object.keys(dataDotNotatedObj).length > 0) {
              try {
                yield col.updateMany(filterObj, {
                  $set: dataDotNotatedObj
                }, {
                  upsert: true
                });
              } catch (error) {
                console.log(chalk.yellow(`Warning: ${error.message}`));
              }
            }
          } else {
            if (Object.keys(dataObj).length > 0) {
              try {
                yield col.insertOne(dataObj);
              } catch (error) {
                console.log(chalk.yellow(`Warning: ${error.message}`));
              }
            }
          }

          stream.resume();
        } catch (error) {
          return reject(error);
        }
      });

      return function (_x15) {
        return _ref7.apply(this, arguments);
      };
    }()).on('close', () => {
      return resolve();
    }).on('error', error => {
      return reject(error);
    });
  });
};

module.exports = apply;