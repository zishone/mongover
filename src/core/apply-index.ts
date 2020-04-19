import { Collection } from 'mongodb';
import { IndexSpec } from '../types/types';
import { getLogger } from '../utils/get-logger';

const logger = getLogger(__filename);

export async function applyIndex(collection: Collection, indexSpec: IndexSpec): Promise<void> {
  const indexName = indexSpec.options.name || JSON.stringify(indexSpec.keys).replace(/[:,]/g, '_').replace(/[{}"]/g, '');
  try {
    const existing = await collection.indexExists(indexName);
    if (existing && (indexSpec.recreate || indexSpec.drop)) {
      logger.info('Dropping Index: %s', indexName);
      logger.cli('------- Dropping Index: %s', indexName);
      await collection.dropIndex(indexName);
    }
    if (indexSpec.drop) {
      logger.info('Dropped Index: %s', indexName);
    } else {
      try {
        logger.info('Building Index: %s', indexName);
        logger.cli('------- Building Index: %s', indexName);
        await collection.createIndex(indexSpec.keys, indexSpec.options);
        logger.info('Built Index: %s', indexName);
      } catch (error) {
        logger.warn('Can\'t build Index: %s: %s', indexName, error.message);
        logger.cli('------- Can\'t build Index: %s: %s', indexName, error.message);
      }
    }
  } catch (error) {
    logger.error('Error applying Index: %s', indexName);
    logger.cli('------- Error applying Index: %s', indexName);
    throw error;
  }
}
