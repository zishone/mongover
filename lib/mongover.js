const requirer = require('./utils/requirer');
const constants = require('./utils/constants');

const mongover = (args) => {
  const command = requirer('commands')[args[2]];
  if(typeof command === 'function') {
    return command(args.slice(3, args.length));
  }
  console.log(constants.help);
};

module.exports = mongover;