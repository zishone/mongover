import {
  CollectionCreateOptions,
  IndexOptions,
} from 'mongodb';

export interface IndexSpec {
  keys: object;
  options: IndexOptions;
  recreate: boolean;
}

export interface CollectionSpec {
  options: CollectionCreateOptions;
  recreateIndexes: boolean;
  recreate: boolean;
}

export interface DataSpec {
  identifierFields: string[];
  ignoreFields: string[];
  preserveUnderscoreId: boolean;
  unsetFields: string[];
  renameFields: Array<{
    from: string;
    to: string;
  }>;
}

export interface MongoverOptions {
  specPath?: string;
  uri?: string;
  dbs?: string[];
  collections?: string[];
  alias?: string[];
  export?: string;
  format?: string;
  query?: any;
  seedOnly?: boolean;
  migrateForce?: boolean;
  info?: string;
  socketTimeoutMS?: number;
}

export interface DatabaseSpec {
  seedOnly: boolean;
  migrateForce: boolean;
  info: string;
  recreate: boolean;
  alias: string | undefined;
  version: string;
  collections: any;
}
