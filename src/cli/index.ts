#! /usr/bin/env node

import debug = require('debug');
import * as minimist from 'minimist';
import { exit, usage } from '../utils/constants';
import { parseOptions } from '../utils/parse-options';
import { apply } from './commands/apply';
import { extract } from './commands/extract';
import { init } from './commands/init';

async function mongover(args: string[]) {
  try {
    const options = parseOptions(minimist(args.slice(3)));
    switch (args[2]) {
      case 'apply':
        await apply(options);
        break;
      case 'init':
        await init(options);
        break;
      case 'extract':
        await extract(options);
        break;
      default:
        console.log(usage);
        process.exit(exit.error);
    }
    process.exit(exit.success);
  } catch (error) {
    process.exit(exit.error);
  }
}

debug.enable('cli:mongover');
mongover(process.argv);
