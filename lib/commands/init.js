const chalk = require('chalk');
const fs = require('fs-extra');
const path = require('path');

const constants = require('../utils/constants');

const init = (args) => {
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
  fs.ensureDirSync(path.join(repo, 'data'));
  const repoName = repo.split(path.sep).pop();
  const serverName = repoName + 'Server';
  const dbName = repoName + 'Db';
  const collectionName = repoName + 'Col';
  const fieldName = repoName + 'Fld';
  const indexName = repoName + 'Idx';
  const spec = initSpec(serverName, dbName, collectionName, fieldName, indexName);
  switch(args.spec){
    case 'dir':
      writeDirSpec(repo, spec, serverName, dbName, collectionName);
      break;
    default:
      writeJsonSpec(repo, spec);
  }
  initDataDir(repo, repoName, dbName, collectionName, fieldName);
  return constants.exit.success;
};

const initSpec = (serverName, dbName, collectionName, fieldName, indexName) => {
  let spec = constants.spec;
  
  spec.databases[dbName] = spec.databases.dbName;
  delete spec.databases.dbName;

  spec.databases[dbName].collections[collectionName] = spec.databases[dbName].collections.collectionName;
  delete spec.databases[dbName].collections.collectionName;

  spec.databases[dbName].collections[collectionName].upsertFields[0] = fieldName + "Str";
  spec.databases[dbName].collections[collectionName].ignoreFields[0] = fieldName + "Str";
  spec.databases[dbName].collections[collectionName].indexes[indexName] = spec.databases[dbName].collections[collectionName].indexes.indexName;
  delete spec.databases[dbName].collections[collectionName].indexes.indexName;

  spec.databases[dbName].collections[collectionName].indexes[indexName].keys[fieldName + "Str"] = spec.databases[dbName].collections[collectionName].indexes[indexName].keys.fieldName;
  delete spec.databases[dbName].collections[collectionName].indexes[indexName].keys.fieldName;

  spec.servers[serverName] = spec.servers.serverName;
  delete spec.servers.serverName;

  spec.servers[serverName].databases[0] = {
    db: dbName
  };

  spec.servers[serverName].databases[1] = {
    db: dbName,
    as: dbName + 'Two'
  };

  return spec;
};

const writeJsonSpec = (repo, spec) => {
  fs.writeJSONSync(path.join(repo, 'mongover.json'), spec, {
    spaces: 2
  });
};

const writeDirSpec = (repo, spec, serverName, dbName, collectionName) => {
  fs.ensureDirSync(path.join(repo, 'mongover', 'databases', dbName));
  fs.ensureDirSync(path.join(repo, 'mongover', 'servers'));
  fs.writeJSONSync(path.join(repo, 'mongover', 'databases', dbName, `${collectionName}.json`), spec.databases[dbName].collections[collectionName], {
    spaces: 2
  });
  fs.writeJSONSync(path.join(repo, 'mongover', 'servers', `${serverName}.json`), spec.servers[serverName], {
    spaces: 2
  });
};

const initDataDir = (repo, repoName, dbName, collectionName, fieldName) => {
  fs.ensureDirSync(path.join(repo, 'data', dbName));
  fs.writeFileSync(path.join(repo, 'data', dbName, `${collectionName}.jsonl`), `{"_id":{"$oid":"aaaaaaaaaaaaaaaaaaaaaaaa"},"${fieldName}Str":"${repoName}"}\n`);
  console.log(chalk.green('Mongover Repository Initialized!'));
};

module.exports = init;