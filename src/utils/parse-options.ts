import { UsageError } from './usage-error';
import EJSON = require('mongodb-extjson');

export interface Args {
  _: string[];
  u: string;
  uri: string;
  d: string;
  dbs: string[];
  c: string;
  collections: string[];
  a: string;
  alias: string[];
  e: string;
  export: string;
  f: string;
  format: string;
  t: string;
  type: string;
  q: string;
  query: any;
}

export function parseOptions(args: any): Args {
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
  if (args.alias.length !== 0 && args.alias.length !== args.dbs.length) {
    throw new UsageError('-d | --db and -a | --alias should have the same length.');
  }
  switch (args.format) {
    case 'dir':
    case 'json':
      break;
    default:
      throw new UsageError('Unknown format specified.');
  }
  return args;
}
