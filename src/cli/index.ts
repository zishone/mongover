#! /usr/bin/env node

import debug = require('debug');
import minimist = require('minimist');
import { exit, usage } from '../utils/constants';
import { getLogger } from '../utils/get-logger';
import { parseOptions } from '../utils/parse-options';
import { apply } from './commands/apply';
import { extract } from './commands/extract';
import { init } from './commands/init';

const logger = getLogger(__filename);

async function mongover(args: string[]) {
  try {
    const parsedArgs = minimist(args.slice(3), {
      string: [
        'uri',
        'format',
        'export',
        'query',
        'alias',
        'dbs',
        'collections',
        'info',
        'socketTimeoutMS',
      ],
      boolean: [
        'seedOnly',
        'migrateForce',
      ],
      alias: {
        u: 'uri',
        d: 'dbs',
        c: 'collections',
        f: 'format',
        e: 'export',
        q: 'query',
        a: 'alias',
        s: 'seedOnly',
        m: 'migrateForce',
        i: 'info',
      },
    });
    const options = parseOptions(parsedArgs);
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
      case 'help':
        console.log(usage);
        break;
      default:
        console.log(usage);
        throw new Error('No such command.');
    }
    process.exit(exit.success);
  } catch (error) {
    logger.cli('Error: %s', error.message);
    process.exit(exit.error);
  }
}

debug.enable('cli:mongover');
mongover(process.argv);
