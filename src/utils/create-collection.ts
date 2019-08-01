import {
  Collection,
  CollectionCreateOptions,
  Db,
} from 'mongodb';
import { getLogger } from './get-logger';

const logger = getLogger(__filename);

interface CollectionSpec {
  options: CollectionCreateOptions;
  dropIndexesFirst: boolean;
  dropFirst: boolean;
}

export async function createCollection(db: Db, collectionName: string, collectionSpec: CollectionSpec, existingCollection: any): Promise<Collection> {
  try {
    logger.debug('Creating Collection: %s', collectionName);
    logger.cli('----- Creating Collection:\t\t\t%s', collectionName);
    const collection = db.collection(collectionName);
    if (existingCollection && collectionSpec.dropFirst) {
      logger.info('Dropping Collection: %s', collectionName);
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
    logger.cli('----- Error creating Collection:\t\t\t%s', collectionName);
    throw error;
  }
}