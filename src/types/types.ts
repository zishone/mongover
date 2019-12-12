import {
  CollectionCreateOptions,
  IndexOptions,
} from 'mongodb';

export interface IndexSpec {
  keys: object;
  options: IndexOptions;
  dropFirst: boolean;
}

export interface CollectionSpec {
  options: CollectionCreateOptions;
  dropIndexesFirst: boolean;
  dropFirst: boolean;
}

export interface DataSpec {
  upsertFields: string[];
  ignoreFields: string[];
  preservePrimaryKey: boolean;
}

export interface MongoverOptions {
  _: string[];
  specPath: string;
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
  s: boolean;
  seedOnly: boolean;
}

export interface DatabaseSpec {
  seedOnly: boolean;
  dropFirst: boolean;
  alias: string | undefined;
  mongoVersion: string;
  collections: any;
}
