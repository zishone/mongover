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
  specPath: string;
  uri: string;
  dbs: string[];
  collections: string[];
  alias: string[];
  export: string;
  format: string;
  query: any;
  seedOnly: boolean;
  migrateForce: boolean;
  infoCollection: string;
}

export interface DatabaseSpec {
  seedOnly: boolean;
  migrateForce: boolean;
  infoCollection: string;
  dropFirst: boolean;
  alias: string | undefined;
  version: string;
  collections: any;
}
