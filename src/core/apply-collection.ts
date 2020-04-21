import {
  Collection,
  Db,
} from 'mongodb';
import { CollectionSpec } from '../types/types';
import { getLogger } from '../utils/get-logger';

const logger = getLogger(__filename);

export async function applyCollection(db: Db, collectionName: string, collectionSpec: CollectionSpec, existingCollection: any): Promise<Collection> {
  try {
    const collection = db.collection(collectionName);
    if (existingCollection && (collectionSpec.recreate || collectionSpec.drop)) {
      logger.info('Dropping Collection: %s', collectionName);
      logger.cli('----- Dropping Collection: %s', collectionName);
      await collection.drop();
      existingCollection = false;
    }
    if (collectionSpec.drop) {
      logger.info('Dropped Collection: %s', collectionName);
    } else if (!existingCollection) {
      logger.info('Creating Collection: %s', collectionName);
      logger.cli('----- Creating Collection: %s', collectionName);
      await db.createCollection(collectionName, collectionSpec.options);
      logger.info('Created Collection: %s', collectionName);
    } else {
      logger.info('Using Existing Collection: %s', collectionName);
      logger.cli('----- Using Existing Collection: %s', collectionName);
    }
    if (existingCollection && collectionSpec.recreateIndexes) {
      logger.info('Dropping Indexes: %s', 'All');
      logger.cli('------- Dropping Indexes: %s', 'All');
      await collection.dropIndexes();
    }
    return collection;
  } catch (error) {
    logger.error('Error applying Collection: %s', collectionName);
    logger.cli('----- Error applying Collection: %s', collectionName);
    throw error;
  }
}
