const requirer = require('./utils/requirer');
const constants = require('./utils/constants');
const minimist = require('minimist');

const mongover = (args) => {
  const command = requirer('commands')[args[2]];
  if(typeof command === 'function') {
    return command(minimist(args.slice(3)));
  }
  console.log(constants.help);
};

module.exports = mongover;