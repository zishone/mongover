import {
  existsSync,
  lstatSync,
  readdirSync,
} from 'fs-extra';
import {
  isAbsolute,
  join,
} from 'path';
import { MongoverOptions } from '../types/types';
import { getLogger } from '../utils/get-logger';
import { getSpec } from '../utils/get-spec';
import { parseOptions } from '../utils/parse-options';
import { applyCollection } from './apply-collection';
import { applyDatabase } from './apply-database';
import { applyIndex } from './apply-index';
import { compareVersion } from './compare-version';
import { connectServer } from './connect-server';
import { importData } from './import-data';
import { versionDatabase } from './version-database';

const logger = getLogger(__filename);

export async function apply(options: MongoverOptions = parseOptions({})): Promise<void> {
  try {
    logger.info('Applying Mongover Specification: %s', options.specPath);
    options = parseOptions(options);
    options.specPath! = isAbsolute(options.specPath!) ? options.specPath! : join(process.cwd(), options.specPath!);
    const databases = [];
    if (options.specPath!.split('.').pop() === 'json') {
      databases.push(getSpec(options.specPath!));
    } else if (lstatSync(options.specPath!).isDirectory() && existsSync(join(options.specPath!, 'db.spec.json'))) {
      databases.push(getSpec(options.specPath!));
    } else {
      readdirSync(options.specPath!)
        .filter((dirent) => lstatSync(join(options.specPath!, dirent)).isDirectory())
        .forEach((dirent) => {
          if (dirent.charAt(0) !== '.') {
            databases.push(getSpec(join(options.specPath!, dirent)));
          }
        });
    }
    const client = await connectServer(options.uri!, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      socketTimeoutMS: options.socketTimeoutMS,
    });
    for (const database of databases) {
      if (options.dbs!.length === 0 || options.dbs!.includes(database.name)) {
        database.spec.alias = options.alias![options.dbs!.indexOf(database.name)];
        if (options.seedOnly!) {
          database.spec.seedOnly = true;
        }
        if (options.migrateForce!) {
          database.spec.migrateForce = true;
        }
        if (options.info) {
          database.spec.info = options.info!;
        }
        let versionCheck: any = {};
        if (database.spec.migrateForce) {
          versionCheck.higher = true;
        } else {
          versionCheck = await compareVersion(client, database.name, database.spec);
        }
        if (versionCheck.higher) {
          const db = await applyDatabase(client, database.name, database.spec, versionCheck.version);
          if (!database.spec.drop) {
            for (const collectionName in database.spec.collections) {
              if (options.collections!.length === 0 || options.collections!.includes(collectionName)) {
                const collectionSpec = database.spec.collections[collectionName];
                const existingCollection = await db
                  .listCollections({ name: collectionName })
                  .toArray();
                if (!existingCollection[0] || !database.spec.seedOnly) {
                  const collection = await applyCollection(db, collectionName, collectionSpec, existingCollection[0]);
                  if (!collectionSpec.drop) {
                    for (const indexSpec of collectionSpec.indexes) {
                      await applyIndex(collection, indexSpec);
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
                } else {
                  logger.info('Skipping Collection: %s already exists', collectionName);
                  logger.cli('----- Skipping Collection: %s already exists', collectionName);
                }
              }
            }
            if (!database.spec.seedOnly || !versionCheck.version || database.spec.migrateForce) {
              await versionDatabase(db, database.spec);
            }
          }
        } else {
          logger.info('Skipping Database: %s is not higher than %s', `${database.spec.alias || database.name}@${database.spec.version}`, versionCheck.version ? `${database.spec.alias || database.name}@${versionCheck.version}` : 'what is applied');
          logger.cli('--- Skipping Database: %s is not higher than %s', `${database.spec.alias || database.name}@${database.spec.version}`, versionCheck.version ? `${database.spec.alias || database.name}@${versionCheck.version}` : 'what is applied');
        }
      }
    }
    logger.info('Done applying Mongover Specification: %s', options.specPath!.replace(process.cwd(), '.'));
    await client.close();
  } catch (error) {
    logger.error('Error applying Mongover Specification to the Server: %O', error);
    throw error;
  }
}
