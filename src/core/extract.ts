import { getLogger } from '../utils/get-logger';
import { writeJSONSync, ensureDirSync, appendFileSync } from 'fs-extra';
import { join } from 'path';
import { databaseSpecTemplate, collectionSpecTemplate } from '../utils/constants';
import { MongoClient } from 'mongodb';
import { connectServer } from '../utils/connect-server';
import { Args } from '../utils/parse-options';
import EJSON = require('mongodb-extjson');
import { UsageError } from '../utils/usage-error';
import { exportData } from '../utils/export-data';

const logger = getLogger(__filename);

export async function extract(options: Args, specPath: string): Promise<MongoClient> {
  try {
    logger.debug('Creating Mongover Specification: %s', specPath);
    logger.cli('Creating Mongover Specification:    %s', specPath);
    const client = await connectServer(options.uri, { useNewUrlParser: true });
    for (const dbName of options.dbs) {
      logger.cli('--- Extracting Database:            %s', dbName);
      const db = client.db(dbName);
      const databaseSpecPath = join(specPath, dbName);
      const collectionSpecPath = join(databaseSpecPath, 'collections');
      const dataPath = join(databaseSpecPath, 'data');
      ensureDirSync(dataPath);
      databaseSpecTemplate.alias = dbName;
      if (options.format === 'dir') {
        ensureDirSync(collectionSpecPath);
        delete databaseSpecTemplate.collections;
      }
      const collectionInfos = await db.listCollections().toArray();
      for (const collectionInfo of collectionInfos) {
        if (options.collections.length === 0 || options.collections.includes(collectionInfo.name)) {
          logger.cli('----- Extracting Collection:        %s', collectionInfo.name);
          const collection = db.collection(collectionInfo.name);
          collectionSpecTemplate.data.ignoreFields = [];
          collectionSpecTemplate.data.upsertFields = [];
          collectionSpecTemplate.options = collectionInfo.options;
          collectionSpecTemplate.indexes = [];
          const indexInfos = await collection
            .listIndexes()
            .toArray();
          for (const indexInfo of indexInfos) {
            if (indexInfo.name !== '_id_') {
              logger.cli('------- Extracting Index:           %s', indexInfo.name);
              const indexOptions = JSON.parse(JSON.stringify(indexInfo));
              delete indexOptions.key;
              delete indexOptions.v;
              delete indexOptions.ns;
              collectionSpecTemplate.indexes.push({
                dropFirst: false,
                keys: indexInfo.key,
                options: indexOptions
              });
            }
          }
          if (options.format === 'dir') {
            writeJSONSync(join(collectionSpecPath, `${collectionInfo.name}.spec.json`), collectionSpecTemplate, { spaces: 2 });
          } else {
            databaseSpecTemplate.collections[collectionInfo.name] = collectionSpecTemplate;
          }
          if (options.export !== 'no') {
            await exportData(collection, join(dataPath, collectionInfo.name), options.export, options.query);
          }
        }
      }
      writeJSONSync(join(databaseSpecPath, 'db.spec.json'), databaseSpecTemplate, { spaces: 2 });
    }
    return client;
  } catch (error) {
    logger.error('Error extacting Mongover Specification from the Server: %O', error);
    throw error;
  }
}
