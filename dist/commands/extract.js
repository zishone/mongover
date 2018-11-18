"use strict";

function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(_next, _throw); } }

function _asyncToGenerator(fn) { return function () { var self = this, args = arguments; return new Promise(function (resolve, reject) { var gen = fn.apply(self, args); function _next(value) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value); } function _throw(err) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err); } _next(undefined); }); }; }

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

const extract =
/*#__PURE__*/
function () {
  var _ref = _asyncToGenerator(function* (args) {
    let conn;

    try {
      const repo = path.join(process.cwd(), args._[0] || '.');

      if (fs.existsSync(repo) && (fs.readdirSync(repo).includes('mongover.json') || fs.readdirSync(repo).includes('mongover'))) {
        console.log(chalk.yellow(`Warning: ${repo.replace(process.cwd(), '.')} is already a Mongover Repository`));
        return constants.exit.cannotExe;
      }

      parseLongOptions(args);

      if (!args.host) {
        args.host = '127.0.0.1:27017';
      }

      if (!args.db) {
        throw new Error('Error: Please specify databases using --db option');
      }

      let spec = {
        databases: {},
        servers: {}
      };
      let mongoUri = 'mongodb://';

      if (args.username || args.password) {
        mongoUri += `${args.username}:${args.password}@`;
      }

      mongoUri += args.host + '/';

      if (args.authsource) {
        mongoUri += `?authsource=${args.authsource}`;
      }

      conn = yield MongoClient.connect(mongoUri, {
        useNewUrlParser: true
      });
      const dbNames = args.db.split(',');
      spec.servers.server = {
        mongoUri: mongoUri,
        databases: dbNames
      };
      let colNames;

      if (args.collection) {
        colNames = args.collection.split(',');
      }

      let db, collections, indexes, data;
      var _iteratorNormalCompletion = true;
      var _didIteratorError = false;
      var _iteratorError = undefined;

      try {
        for (var _iterator = dbNames[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
          let dbName = _step.value;
          spec.databases[dbName] = {
            collections: {},
            dropFirst: false
          };
          db = yield conn.db(dbName);
          let filter = {};

          if (colNames) {
            filter.name = {
              $in: colNames
            };
          }

          collections = yield db.listCollections(filter).toArray();
          var _iteratorNormalCompletion2 = true;
          var _didIteratorError2 = false;
          var _iteratorError2 = undefined;

          try {
            for (var _iterator2 = collections[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
              let collection = _step2.value;
              spec.databases[dbName].collections[collection.name] = {
                options: collection.options,
                upsertFields: [],
                ignoreFields: [],
                preserveObjectId: false,
                dropIndexesFirst: false,
                indexes: {},
                dropFirst: false
              };
              indexes = yield db.collection(collection.name).listIndexes().toArray();
              var _iteratorNormalCompletion3 = true;
              var _didIteratorError3 = false;
              var _iteratorError3 = undefined;

              try {
                for (var _iterator3 = indexes[Symbol.iterator](), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
                  let index = _step3.value;

                  if (index.name !== '_id_') {
                    spec.databases[dbName].collections[collection.name].indexes[index.name] = {
                      keys: index.key,
                      options: _.omit(index, ['key', 'v', 'name', 'ns']),
                      dropFirst: false
                    };
                  }
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

              if (args.data !== 'no') {
                fs.ensureDirSync(path.join(repo, 'data', dbName));
                data = yield db.collection(collection.name).find();
                yield writeData(data, path.join(repo, 'data', dbName, `${collection.name}.jsonl`));
              }
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

      switch (args.format) {
        case 'dir':
          writeDirSpec(repo, spec);
          break;

        default:
          writeJsonSpec(repo, spec);
      }

      yield conn.close();
      console.log(chalk.green('Mongover Specification Extracted and Repository Initialized!'));
      return constants.exit.success;
    } catch (error) {
      console.log(chalk.red(`Error: ${error.message}`));

      if (conn) {
        yield conn.close();
      }

      return constants.exit.error;
    }
  });

  return function extract(_x) {
    return _ref.apply(this, arguments);
  };
}();

const writeData = (data, file) => {
  return new Promise((resolve, reject) => {
    data.on('data', d => {
      fs.appendFileSync(file, EJSON.stringify(d) + '\n');
    }).on('end', () => {
      return resolve();
    }).on('error', error => {
      return reject(error);
    });
  });
};

module.exports = extract;