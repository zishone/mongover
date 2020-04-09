import {
  existsSync,
  lstatSync,
  readdirSync,
} from 'fs-extra';
import { join } from 'path';
import { MongoverOptions } from '../types/types';
import { getLogger } from '../utils/get-logger';
import { parseOptions } from '../utils/parse-options';
import { buildIndex } from './build-index';
import { compareVersion } from './compare-version';
import { connectServer } from './connect-server';
import { createCollection } from './create-collection';
import { getSpec } from './get-spec';
import { importData } from './import-data';
import { structureDatabase } from './structure-database';
import { versionDatabase } from './version-database';

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
        database.spec.alias = options.alias[options.dbs.indexOf(database.name)];
        if (options.seedOnly) {
          database.spec.seedOnly = true;
        }
        if (options.migrateForce) {
          database.spec.migrateForce = true;
        }
        let versionCheck: any = {};
        if (database.spec.migrateForce) {
          versionCheck.higher = true;
        } else {
          versionCheck = await compareVersion(client, database.name, options.infoCollection, database.spec);
        }
        if (versionCheck.higher) {
          const db = await structureDatabase(client, database.name, database.spec, versionCheck.version);
          for (const collectionName in database.spec.collections) {
            if (options.collections.length === 0 || options.collections.includes(collectionName)) {
              const collectionSpec = database.spec.collections[collectionName];
              const existingCollection = await db
                .listCollections({ name: collectionName })
                .toArray();
              if (!existingCollection[0] || !database.spec.seedOnly) {
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
              } else {
                logger.info('Skipping Collection: %s exists', collectionName);
                logger.cli('----- Skipping Collection: %s exists', collectionName);
              }
            }
          }
          if (!database.spec.seedOnly || !versionCheck.version || database.spec.migrateForce) {
            database.spec.infoCollection = options.infoCollection;
            await versionDatabase(db, database.spec);
          }
        } else {
          logger.debug('Skipping Version: %s is not higher than what is applied', `${database.spec.alias || database.name}@${database.spec.version}`);
          logger.cli('--- Skipping Version: %s is not higher than what is applied', `${database.spec.alias || database.name}@${database.spec.version}`);
        }
      }
    }
    await client.close();
  } catch (error) {
    logger.error('Error applying Mongover Specification to the Server: %O', error);
    throw error;
  }
}
