import { getLogger } from './get-logger';
import { Db, CollectionCreateOptions, Collection, IndexOptions } from 'mongodb';

const logger = getLogger(__filename);

interface CollectionSpec {
  options: CollectionCreateOptions;
  dropIndexesFirst: boolean;
  dropFirst: boolean;
}

export async function createCollection(db: Db, collectionName: string, collectionSpec: CollectionSpec): Promise<Collection> {
  try {
    logger.debug('Creating Collection: %s', collectionName);
    logger.cli('----- Creating Collection:          %s', collectionName);
    const collection = db.collection(collectionName);
    const existing = await db
      .listCollections({ name: collectionName })
      .toArray();
    if (existing[0] && collectionSpec.dropFirst) {
      logger.info('Dropping Collection: %s', collectionName);
      await collection.drop();
      await db.createCollection(collectionName, collectionSpec.options);
    } else if (existing[0] && collectionSpec.dropIndexesFirst) {
      logger.info('Dropping all Indexes in Collection: %s', collectionName);
      await collection.dropIndexes();
    } else if (!existing[0]) {
      await db.createCollection(collectionName, collectionSpec.options);
    }
    logger.info('Created Collection: %s', collectionName);
    return collection;
  } catch (error) {
    logger.error('Error creating Collection: %s', collectionName);
    logger.cli('----- Error creating Collection:    %s', collectionName);
    throw error;
  }
}
