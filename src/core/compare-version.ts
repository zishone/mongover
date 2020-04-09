import { MongoClient } from 'mongodb';
import { satisfies } from 'semver';
import { DatabaseSpec } from '../types/types';
import { getLogger } from '../utils/get-logger';

const logger = getLogger(__filename);

export async function compareVersion(client: MongoClient, databaseName: string, infoCollection: string, databaseSpec: DatabaseSpec): Promise<boolean> {
  try {
    const info = await client
      .db(databaseSpec.alias || databaseName)
      .collection(infoCollection)
      .findOne({});
    if (info && satisfies(info.version, `>=${databaseSpec.version}`)) {
      logger.debug('Skipping Version: %s is not higher than %s', `${databaseSpec.alias || databaseName}@${databaseSpec.version}`, `${databaseSpec.alias || databaseName}@${info.version}`);
      logger.cli('--- Skipping Version: %s is not higher than %s', `${databaseSpec.alias || databaseName}@${databaseSpec.version}`, `${databaseSpec.alias || databaseName}@${info.version}`);
      return false;
    } else {
      logger.debug('Applying Version: %s', `${databaseSpec.alias || databaseName}@${databaseSpec.version}`);
      logger.cli('--- Applying Version: %s', `${databaseSpec.alias || databaseName}@${databaseSpec.version}`);
      return true;
    }
  } catch (error) {
    logger.error('Error comparing Version: %s', `${databaseSpec.alias || databaseName}@${databaseSpec.version}`);
    logger.cli('--- Error comparing Version: %s', `${databaseSpec.alias || databaseName}@${databaseSpec.version}`);
    throw error;
  }
}
