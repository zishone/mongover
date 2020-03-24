import {
  Collection,
  Db,
} from 'mongodb';
import { CollectionSpec } from '../types/types';
import { getLogger } from './get-logger';

const logger = getLogger(__filename);

export async function createCollection(db: Db, collectionName: string, collectionSpec: CollectionSpec, existingCollection: any): Promise<Collection> {
  try {
    logger.debug('Creating Collection: %s', collectionName);
    logger.cli('----- Creating Collection: %s', collectionName);
    const collection = db.collection(collectionName);
    if (existingCollection && collectionSpec.dropFirst) {
      logger.info('Dropping Collection: %s', collectionName);
      logger.cli('----- Dropping Collection: %s', collectionName);
      await collection.drop();
      await db.createCollection(collectionName, collectionSpec.options);
    } else if (existingCollection && collectionSpec.dropIndexesFirst) {
      logger.info('Dropping all Indexes in Collection: %s', collectionName);
      await collection.dropIndexes();
    } else if (!existingCollection) {
      await db.createCollection(collectionName, collectionSpec.options);
    }
    logger.info('Created Collection: %s', collectionName);
    return collection;
  } catch (error) {
    logger.error('Error creating Collection: %s', collectionName);
    logger.cli('----- Error creating Collection: %s', collectionName);
    throw error;
  }
}
