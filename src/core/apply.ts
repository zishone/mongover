import {
  existsSync,
  lstatSync,
  readdirSync,
} from 'fs-extra';
import { join } from 'path';
import { MongoverOptions } from '../types/types';
import { buildIndex } from '../utils/build-index';
import { connectServer } from '../utils/connect-server';
import { createCollection } from '../utils/create-collection';
import { getLogger } from '../utils/get-logger';
import { getSpec } from '../utils/get-spec';
import { importData } from '../utils/import-data';
import { parseOptions } from '../utils/parse-options';
import { structureDatabase } from '../utils/structure-database';
import { versionDatabase } from '../utils/version-database';

const logger = getLogger(__filename);

export async function apply(options: MongoverOptions = parseOptions({})): Promise<void> {
  try {
    logger.debug('Applying Mongover Specification: %s', options.specPath);
    options = parseOptions(options);
    const databases = [];
    if (options.specPath.split('.').pop() === 'json') {
      databases.push(getSpec(options.specPath));
    } else if (lstatSync(options.specPath).isDirectory() && existsSync(join(options.specPath, 'db.spec.json'))) {
      databases.push(getSpec(options.specPath));
    } else {
      readdirSync(options.specPath)
        .filter((dirent) => lstatSync(join(options.specPath, dirent)).isDirectory())
        .forEach((dirent) => databases.push(getSpec(join(options.specPath, dirent))));
    }
    const client = await connectServer(options.uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    for (const database of databases) {
      if (options.dbs.length === 0 || options.dbs.includes(database.name)) {
        if (options.alias.length !== 0) {
          database.spec.alias = options.alias[options.dbs.indexOf(database.name)];
        }
        const db = await structureDatabase(client, database.name, database.spec);
        for (const collectionName in database.spec.collections) {
          if (options.collections.length === 0 || options.collections.includes(collectionName)) {
            const collectionSpec = database.spec.collections[collectionName];
            const existingCollection = await db
              .listCollections({ name: collectionName })
              .toArray();
            if (!existingCollection[0] || !options.seedOnly) {
              const collection = await createCollection(db, collectionName, collectionSpec, existingCollection[0]);
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
        if (!options.seedOnly) {
          await versionDatabase(db, database.spec);
        }
      }
    }
    await client.close();
  } catch (error) {
    logger.error('Error applying Mongover Specification to the Server: %O', error);
    throw error;
  }
}
