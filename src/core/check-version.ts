import {
  Db,
  MongoClient,
} from 'mongodb';
import { DatabaseSpec } from '../types/types';
import { getLogger } from '../utils/get-logger';

const logger = getLogger(__filename);

export async function checkVersion(client: MongoClient, databaseName: string, infoCollection: string, databaseSpec: DatabaseSpec): Promise<boolean> {
  try {
    logger.debug('Checking Version: %s', `${databaseSpec.alias || databaseName}@${databaseSpec.version}`);
    logger.cli('--- Checking Version: %s', `${databaseSpec.alias || databaseName}@${databaseSpec.version}`);
    const info = await client
      .db(databaseSpec.alias || databaseName)
      .collection(infoCollection)
      .findOne({});
    if (info && info.version === databaseSpec.version) {
      logger.debug('Skipping Version: %s is same as %s', `${databaseSpec.alias || databaseName}@${databaseSpec.version}`, `${databaseSpec.alias || databaseName}@${info.version}`);
      logger.cli('--- Skipping Version: %s is same as %s', `${databaseSpec.alias || databaseName}@${databaseSpec.version}`, `${databaseSpec.alias || databaseName}@${info.version}`);
      return false;
    } else {
      logger.debug('Applying Version: %s', `${databaseSpec.alias || databaseName}@${databaseSpec.version}`);
      logger.cli('--- Applying Version: %s', `${databaseSpec.alias || databaseName}@${databaseSpec.version}`);
      return true;
    }
  } catch (error) {
    logger.error('Error checking Version: %s', `${databaseSpec.alias || databaseName}@${databaseSpec.version}`);
    logger.cli('--- Error checking Version: %s', `${databaseSpec.alias || databaseName}@${databaseSpec.version}`);
    throw error;
  }
}
