const fs = require('fs-extra');
const path = require('path');

module.exports = (directory) => {
  const files = {};
  directory = path.join(__dirname, '../', directory);
  if(fs.existsSync(directory)) {
    fs
      .readdirSync(directory)
      .forEach(script => {
      const scriptPath = path.join(directory, script);
      if(/\.js$/.test(scriptPath)){
        files[path.parse(script).name] = require(scriptPath);
      }
    })
  }
  return files;
}
