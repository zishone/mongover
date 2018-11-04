const fs = require('fs-extra');
const path = require('path');

module.exports = (directory) => {
  const files = {};
  if(fs.existsSync(directory)) {
    fs
      .readdirSync(directory)
      .forEach(script => {
      const scriptPath = path.join(directory, script);
      if(/\.js$/.test(scriptPath) || /\.json$/.test(scriptPath)){
        files[path.parse(script).name] = require(scriptPath);
      }
    })
  }
  return files;
}
