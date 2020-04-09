import { Collection } from 'mongodb';
import { IndexSpec } from '../types/types';
import { getLogger } from '../utils/get-logger';

const logger = getLogger(__filename);

export async function buildIndex(collection: Collection, indexSpec: IndexSpec): Promise<void> {
  const indexName = indexSpec.options.name || JSON.stringify(indexSpec.keys).replace(/[:,]/g, '_').replace(/[{}"]/g, '');
  try {
    const existing = await collection.indexExists(indexName);
    if (existing && indexSpec.dropFirst) {
      logger.info('Dropping Index: %s', indexName);
      logger.cli('--------- Dropping Index: %s', indexName);
      await collection.dropIndex(indexName);
    }
    try {
      logger.debug('Building Index: %s', indexName);
      logger.cli('--------- Building Index: %s', indexName);
      await collection.createIndex(indexSpec.keys, indexSpec.options);
    } catch (error) {
      logger.warn('Can\'t build Index: %s: %s', indexName, error.message);
      logger.cli('--------- Can\'t build Index: %s: %s', indexName, error.message);
    }
  } catch (error) {
    logger.error('Error building Index: %s', indexName);
    logger.cli('--------- Error building Index: %s', indexName);
    throw error;
  }
}
