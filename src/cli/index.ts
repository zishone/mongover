#! /usr/bin/env node

import { parseOptions } from '../utils/parse-options';
import { apply } from '../core/apply';
import { join } from 'path';
import { usage, exit } from '../utils/constants';
import { MongoClient } from 'mongodb';
import { init } from '../core/init';
import * as minimist from 'minimist';
import debug = require('debug');
import { getLogger } from '../utils/get-logger';
import { extract } from '../core/extract';

const logger = getLogger(__filename);

async function mongover(args: string[]) {
  try {
    const options = parseOptions(minimist(args.slice(3)));
    let client: MongoClient;
    switch (args[2]) {
      case 'apply':
        client = await apply(options.uri, join(process.cwd(), options._[0] || 'mongover'), options);
        await client.close();
        break;
      case 'init':
        await init(options.format, join(process.cwd(), options._[0] || 'mongover'));
        break;
      case 'extract':
        await extract(options, join(process.cwd(), options._[0] || 'mongover'));
        break;
      default:
        console.log(usage);
        break;
    }
    process.exit(exit.success);
  } catch (error) {
    logger.cli('Error: %O', error);
    process.exit(exit.error);
  }
}

debug.enable('mongover:cli*');
mongover(process.argv);
