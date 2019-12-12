import {
  Db,
  MongoClient,
} from 'mongodb';
import { DatabaseSpec } from '../types/types';
import { getLogger } from './get-logger';

const logger = getLogger(__filename);

export async function structureDatabase(client: MongoClient, databaseName: string, databaseSpec: DatabaseSpec): Promise<Db> {
  try {
    logger.debug('Structuring Database: %s', databaseName + (databaseSpec.alias ? ` as ${databaseSpec.alias}` : ''));
    logger.cli('--- Structuring Database:\t\t\t%s', databaseName + (databaseSpec.alias ? ` as ${databaseSpec.alias}` : ''));
    const db = client.db(databaseSpec.alias || databaseName);
    if (databaseSpec.dropFirst) {
      logger.info('Dropping Database: %s', databaseSpec.alias || databaseName);
      logger.cli('--- Dropping Database:\t\t\t%s', databaseName + (databaseSpec.alias ? ` as ${databaseSpec.alias}` : ''));
      await db.dropDatabase();
    }
    logger.info('Structured Database: %s', databaseName + (databaseSpec.alias ? ` as ${databaseSpec.alias}` : ''));
    return db;
  } catch (error) {
    logger.error('Error structuring Database: %s', databaseName + (databaseSpec.alias ? ` as ${databaseSpec.alias}` : ''));
    logger.cli('--- Error structuring Database:\t\t\t%s', databaseName + (databaseSpec.alias ? ` as ${databaseSpec.alias}` : ''));
    throw error;
  }
}
