"use strict";

const requireMany = require('./utils/requireMany');

const constants = require('./utils/constants');

const minimist = require('minimist');

const path = require('path');

const mongover = args => {
  const command = requireMany(path.join(__dirname, 'commands'))[args[2]];

  if (typeof command === 'function') {
    return command(minimist(args.slice(3)));
  }

  console.log(constants.help);
};

module.exports = mongover;