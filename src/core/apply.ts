import { MongoClient } from 'mongodb';
import { connectServer } from '../utils/connect-server';
import { getLogger } from '../utils/get-logger';
import { getSpec } from '../utils/get-spec';
import { readdirSync, lstatSync, existsSync } from 'fs-extra';
import { join } from 'path';
import { structureDatabase } from '../utils/structure-database';
import { createCollection } from '../utils/create-collection';
import { buildIndex } from '../utils/build-index';
import { importData } from '../utils/import-data';
import { Args, parseOptions } from '../utils/parse-options';

const logger = getLogger(__filename);

export async function apply(client: string | MongoClient, specPath: string, options: Args | undefined): Promise<MongoClient> {
  try {
    logger.debug('Applying mongover specification to the server.');
    if (!options) {
      options = parseOptions({});
    }
    if (!specPath) {
      specPath = join(process.cwd(), 'mongover');
    }
    const databases = [];
    if (specPath.split('.').pop() === 'json') {
      databases.push(getSpec(specPath));
    } else if (lstatSync(specPath).isDirectory() && existsSync(join(specPath, 'db.spec.json'))) {
      databases.push(getSpec(specPath));
    } else {
      readdirSync(specPath, { withFileTypes: true })
        .filter((dirent) => dirent.isDirectory())
        .forEach((dirent) => databases.push(getSpec(join(specPath, dirent.name))));
    }
    if (!client) {
      client = 'mongodb://127.0.0.1:27017/';
    }
    if (typeof client === 'string') {
      client = await connectServer(client, { useNewUrlParser: true });
    }
    for (const database of databases) {
      if (options.dbs.length === 0 || options.dbs.includes(database.name)) {
        if (options.alias.length !== 0) {
          database.spec.alias = options.alias[options.dbs.indexOf(database.name)];
        }
        const db = await structureDatabase(client, database.name, database.spec);
        for (const collectionName in database.spec.collections) {
          if (options.collections.length === 0 || options.collections.includes(collectionName)) {
            if (database.spec.collections.hasOwnProperty(collectionName)) {
              const collectionSpec = database.spec.collections[collectionName];
              const collection = await createCollection(db, collectionName, collectionSpec);
              for (const indexSpec of collectionSpec.indexes) {
                await buildIndex(collection, indexSpec);
              }
              const dataPath = database.dataPath;
              if (existsSync(dataPath)) {
                for (const dataFile of readdirSync(dataPath)) {
                  if (dataFile.split('.')[0] === collectionName) {
                    await importData(collection, collectionSpec.data, join(dataPath, dataFile));
                  }
                }
              }
            }
          }
        }
      }
    }
    return client;
  } catch (error) {
    logger.error('Error applying Mongover Specification to the Server: %O', error);
    throw error;
  }
}
