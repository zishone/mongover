import EJSON = require('mongodb-extended-json');
import { join } from 'path';
import { MongoverOptions } from '../types/types';
import { mongoverOptionsDefaults } from './constants';

export function parseOptions(args: any): MongoverOptions {
  try {
    const mongoverOptions: MongoverOptions = mongoverOptionsDefaults;
    if (args.specPath) {
      mongoverOptions.specPath = args.specPath;
    } else if (args._ && args._[0]) {
      mongoverOptions.specPath = args._[0];
    }
    if (args.uri) {
      mongoverOptions.uri = args.uri;
    }
    if (typeof args.dbs === 'string') {
      mongoverOptions.dbs = args.dbs.split(',');
      mongoverOptions.alias = args.dbs.split(',');
    } else if (Array.isArray(args.dbs)) {
      mongoverOptions.dbs = args.dbs;
    }
    if (typeof args.alias === 'string') {
      mongoverOptions.alias = args.alias.split(',');
    } else if (Array.isArray(args.alias)) {
      mongoverOptions.alias = args.alias;
    } else {
      mongoverOptions.alias = mongoverOptions.dbs;
    }
    if (typeof args.collections === 'string') {
      mongoverOptions.collections = args.collections.split(',');
    } else if (Array.isArray(args.collections)) {
      mongoverOptions.collections = args.collections;
    }
    if (typeof args.query === 'string') {
      mongoverOptions.query = EJSON.parse(args.query.replace(/(['"])?([a-zA-Z0-9_$.]+)(['"])?:/g, '"$2": '), { relaxed: true });
    } else if (typeof args.query === 'object') {
      mongoverOptions.query = args.query;
    }
    if (args.format) {
      mongoverOptions.format = args.format;
    }
    if (args.export) {
      mongoverOptions.export = args.export;
    }
    if (args.seedOnly) {
      mongoverOptions.seedOnly = true;
    }
    if (args.migrateForce) {
      mongoverOptions.migrateForce = true;
    }
    if (args.info) {
      mongoverOptions.info = args.info;
    } else {
      mongoverOptions.info = undefined;
    }

    if (mongoverOptions.alias!.length !== mongoverOptions.dbs!.length) {
      throw new Error('-d | --dbs and -a | --alias should have the same length.');
    }
    switch (mongoverOptions.format) {
      case 'dir':
      case 'json':
        break;
      default:
        throw new Error('Unknown format specified.');
    }
    switch (mongoverOptions.export) {
      case 'no':
      case 'json':
      case 'jsonl':
        break;
      default:
        throw new Error('Unknown export type specified.');
    }
    return mongoverOptions;
  } catch (error) {
    throw error;
  }
}
