import {
  Db,
  MongoClient,
} from 'mongodb';
import { DatabaseSpec } from '../types/types';
import { getLogger } from './get-logger';

const logger = getLogger(__filename);

export async function versionDatabase(db: Db, databaseSpec: DatabaseSpec): Promise<Db> {
  try {
    logger.debug('Versioning Database: %s', `${db.databaseName}@${databaseSpec.mongoVersion}`);
    logger.cli('--- Versioning Database:\t\t\t\t%s', `${db.databaseName}@${databaseSpec.mongoVersion}`);
    const mongoVersion = { mongoVersion: databaseSpec.mongoVersion };
    const collection = db.collection('mongover');
    const currentVersion = await collection.findOne({});
    if (currentVersion) {
      await collection.updateOne({}, { $set: mongoVersion });
    } else {
      await collection.insertOne(mongoVersion);
    }
    logger.info('Versioned Database: %s', `${db.databaseName}@${databaseSpec.mongoVersion}`);
    return db;
  } catch (error) {
    logger.error('Error versioning Database: %s', `${db.databaseName}@${databaseSpec.mongoVersion}`);
    logger.cli('--- Error versioning Database:\t\t\t%s', `${db.databaseName}@${databaseSpec.mongoVersion}`);
    throw error;
  }
}
