import {
  Db,
  MongoClient,
} from 'mongodb';
import { DatabaseSpec } from '../types/types';
import { getLogger } from '../utils/get-logger';

const logger = getLogger(__filename);

export async function applyDatabase(client: MongoClient, databaseName: string, databaseSpec: DatabaseSpec, appliedVersion?: string): Promise<Db> {
  try {
    const db = client.db(databaseSpec.alias || databaseName);
    if ((databaseSpec.drop || databaseSpec.recreate) && !databaseSpec.seedOnly) {
      logger.info('Dropping Database: %s', databaseSpec.alias || databaseName);
      logger.cli('--- Dropping Database: %s', databaseSpec.alias || databaseName);
      await db.dropDatabase();
    }
    if (databaseSpec.drop) {
      logger.info('Dropped Database: %s', databaseSpec.alias || databaseName);
    } else {
      logger.info('Structuring Database: %s@%s', databaseName + (databaseSpec.alias ? ` as ${databaseSpec.alias}` : ''), databaseSpec.version);
      logger.cli('--- Structuring Database: %s@%s', databaseName + (databaseSpec.alias ? ` as ${databaseSpec.alias}` : ''), databaseSpec.version);
      logger.info('Structured Database: %s@%s', databaseName + (databaseSpec.alias ? ` as ${databaseSpec.alias}` : ''), databaseSpec.version);
    }
    return db;
  } catch (error) {
    logger.error('Error applying Database: %s', databaseName + (databaseSpec.alias ? ` as ${databaseSpec.alias}` : ''));
    logger.cli('--- Error applying Database: %s', databaseName + (databaseSpec.alias ? ` as ${databaseSpec.alias}` : ''));
    throw error;
  }
}
