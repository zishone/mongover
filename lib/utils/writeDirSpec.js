const fs = require('fs-extra');
const path = require('path');

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

module.exports = writeDirSpec;