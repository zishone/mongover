import {
  Db,
  MongoClient,
} from 'mongodb';
import { DatabaseSpec } from '../types/types';
import { getLogger } from '../utils/get-logger';

const logger = getLogger(__filename);

export async function structureDatabase(client: MongoClient, databaseName: string, databaseSpec: DatabaseSpec, appliedVersion?: string): Promise<Db> {
  try {
    const db = client.db(databaseSpec.alias || databaseName);
    if (databaseSpec.dropFirst && !databaseSpec.seedOnly) {
      logger.info('Dropping Database: %s%s', databaseSpec.alias || databaseName, appliedVersion ? `@${appliedVersion}` : '');
      logger.cli('--- Dropping Database: %s%s', databaseSpec.alias || databaseName, appliedVersion ? `@${appliedVersion}` : '');
      await db.dropDatabase();
    }
    logger.info('Structuring Database: %s@%s', databaseName + (databaseSpec.alias ? ` as ${databaseSpec.alias}` : ''), databaseSpec.version);
    logger.cli('--- Structuring Database: %s@%s', databaseName + (databaseSpec.alias ? ` as ${databaseSpec.alias}` : ''), databaseSpec.version);
    logger.info('Structured Database: %s@%s', databaseName + (databaseSpec.alias ? ` as ${databaseSpec.alias}` : ''), databaseSpec.version);
    return db;
  } catch (error) {
    logger.error('Error structuring Database: %s', databaseName + (databaseSpec.alias ? ` as ${databaseSpec.alias}` : ''));
    logger.cli('--- Error structuring Database: %s', databaseName + (databaseSpec.alias ? ` as ${databaseSpec.alias}` : ''));
    throw error;
  }
}
