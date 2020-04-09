import { MongoClient } from 'mongodb';
import { satisfies } from 'semver';
import { DatabaseSpec } from '../types/types';
import { getLogger } from '../utils/get-logger';

const logger = getLogger(__filename);

export async function compareVersion(client: MongoClient, databaseName: string, infoCollection: string, databaseSpec: DatabaseSpec): Promise<any> {
  try {
    const info = await client
      .db(databaseSpec.alias || databaseName)
      .collection(infoCollection)
      .findOne({});
    if (info && satisfies(info.version, `>=${databaseSpec.version}`)) {
      return {
        higher: false,
        version: info.version,
      };
    } else if (info) {
      return {
        higher: true,
        version: info.version,
      };
    } else {
      return { higher: true };
    }
  } catch (error) {
    logger.error('Error comparing Version: %s', `${databaseSpec.alias || databaseName}@${databaseSpec.version}`);
    logger.cli('--- Error comparing Version: %s', `${databaseSpec.alias || databaseName}@${databaseSpec.version}`);
    throw error;
  }
}
