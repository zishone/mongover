const fs = require('fs-extra');
const path = require('path');

const writeJsonSpec = (repo, spec) => {
  fs.writeJSONSync(path.join(repo, 'mongover.json'), spec, {
    spaces: 2
  });
};

module.exports = writeJsonSpec;