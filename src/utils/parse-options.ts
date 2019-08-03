import EJSON = require('mongodb-extended-json');
import { join } from 'path';
import { MongoverOptions } from '../types/types';
import { usage } from './constants';

export function parseOptions(args: any): MongoverOptions {
  try {
    if (args._ && args._[0]) {
      args.specPath = join(process.cwd(), args._[0]);
    }
    if ((!args._ || !args._[0]) && !args.specPath) {
      args.specPath = join(process.cwd(), 'mongover');
    }
    if (args.u) {
      args.uri = args.u;
    }
    if (!args.uri) {
      args.uri = 'mongodb://127.0.0.1:27017/';
    }
    if (args.d) {
      args.dbs = args.d.split(',');
    }
    if (typeof args.dbs === 'string') {
      args.dbs = args.dbs.split(',');
    }
    if (!args.dbs) {
      args.dbs = [];
    }
    if (args.a) {
      args.alias = args.a.split(',');
    }
    if (typeof args.alias === 'string') {
      args.alias =  args.alias.split(',');
    }
    if (!args.alias) {
      args.alias = [];
    }
    if (args.c) {
      args.collections = args.c.split(',');
    }
    if (typeof args.collections === 'string') {
      args.collections = args.collections.split(',');
    }
    if (!args.collections) {
      args.collections = [];
    }
    if (args.e) {
      args.export = args.e;
    }
    if (!args.export) {
      args.export = 'no';
    }
    if (typeof args.export === 'boolean') {
      args.export = 'jsonl';
    }
    if (args.f) {
      args.format = args.f;
    }
    if (!args.format) {
      args.format = 'dir';
    }
    if (args.q) {
      args.query = EJSON.parse(args.q.replace(/(['"])?([a-zA-Z0-9_$.]+)(['"])?:/g, '"$2": '), { relaxed: true });
    }
    if (typeof args.query === 'string') {
      args.query = EJSON.parse(args.query.replace(/(['"])?([a-zA-Z0-9_$.]+)(['"])?:/g, '"$2": '), { relaxed: true });
    }
    if (!args.query) {
      args.query = {};
    }
    if (args.s) {
      args.seedOnly = true;
    }
    if (!args.s) {
      args.seedOnly = false;
    }
    if (args.seedOnly) {
      args.seedOnly = true;
    }
    if (!args.seedOnly) {
      args.seedOnly = false;
    }
    if (args.alias.length !== 0 && args.alias.length !== args.dbs.length) {
      throw new Error('-d | --db and -a | --alias should have the same length.');
    }
    switch (args.format) {
      case 'dir':
      case 'json':
        break;
      default:
        throw new Error('Unknown format specified.');
    }
  } catch (error) {
    console.log(usage);
    throw error;
  }
  return args;
}
