import { getLogger } from '../utils/get-logger';
import { writeJSONSync, ensureDirSync, appendFileSync } from 'fs-extra';
import { join } from 'path';
import { databaseSpecTemplate, collectionSpecTemplate } from '../utils/constants';
import { MongoClient } from 'mongodb';
import { connectServer } from '../utils/connect-server';
import { Args } from '../utils/parse-options';
import EJSON = require('mongodb-extjson');
import { UsageError } from '../utils/usage-error';

const logger = getLogger(__filename);

// TODO: Refine logging for cli.
// TODO: Throw error when give --format is unknown
export async function extract(options: Args, specPath: string): Promise<MongoClient> {
  try {
    logger.debug('Extracting Mongover Specification from the Server: %s', specPath);
    logger.cli('Extracting Mongover Specification from the Server: %s', specPath);
    const client = await connectServer(options.uri, { useNewUrlParser: true });
    for (const dbName of options.dbs) {
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
      const collections = await db.listCollections().toArray();
      for (const collection of collections) {
        if (options.collections.length === 0 || options.collections.includes(collection.name)) {
          collectionSpecTemplate.data.ignoreFields = [];
          collectionSpecTemplate.data.upsertFields = [];
          collectionSpecTemplate.options = collection.options;
          collectionSpecTemplate.indexes = [];
          const indexes = await db
            .collection(collection.name)
            .listIndexes()
            .toArray();
          for (const index of indexes) {
            if (index.name !== '_id_') {
              const indexOptions = JSON.parse(JSON.stringify(index));
              delete indexOptions.key;
              delete indexOptions.v;
              delete indexOptions.ns;
              collectionSpecTemplate.indexes.push({
                dropFirst: false,
                keys: index.key,
                options: indexOptions
              });
            }
          }
          if (options.format === 'dir') {
            writeJSONSync(join(collectionSpecPath, `${collection.name}.spec.json`), collectionSpecTemplate, { spaces: 2 });
          } else {
            databaseSpecTemplate.collections[collection.name] = collectionSpecTemplate;
          }
          const cursor = db
            .collection(collection.name)
            .find(options.query);
          switch (options.export) {
            case 'jsonl':
              await new Promise((resolve, reject) => {
                cursor
                  .on('data', (d) => {
                    try {
                      appendFileSync(join(dataPath, `${collection.name}.jsonl`), EJSON.stringify(d, { relaxed: true }) + '\n');
                    } catch (error) {
                      cursor.emit('error', error);
                    }
                  })
                  .on('end', () => {
                    resolve();
                  })
                  .on('error', (error) => {
                    reject(error);
                  });
              });
              break;
            case 'json':
              const data = await cursor.toArray();
              writeJSONSync(join(dataPath, `${collection.name}.json`), JSON.parse(EJSON.stringify(data, { relaxed: true })), { spaces: 2 });
              break;
            case 'no':
              break;
            default:
                throw new UsageError(`Unrecognized Export type: ${options.export}.`);
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
