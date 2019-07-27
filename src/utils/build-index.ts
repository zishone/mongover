import {
  Collection,
  IndexOptions,
} from 'mongodb';
import { getLogger } from './get-logger';

const logger = getLogger(__filename);

interface IndexSpec {
  keys: object;
  options: IndexOptions;
  dropFirst: boolean;
}

export async function buildIndex(collection: Collection, indexSpec: IndexSpec): Promise<void> {
  const indexName = indexSpec.options.name || JSON.stringify(indexSpec.keys).replace(/[:,]/g, '_').replace(/[{}"]/g, '');
  try {
    logger.debug('Building Index: %s', indexName);
    logger.cli('------- Building Index:\t\t\t\t%s', indexName);
    const existing = await collection.indexExists(indexName);
    if (existing && indexSpec.dropFirst) {
      logger.info('Dropping Index: %s', indexName);
      await collection.dropIndex(indexName);
    }
    try {
      await collection.createIndex(indexSpec.keys, indexSpec.options);
    } catch (error) {
      logger.warn('Can\'t build Index: %s: %s', indexName, error.message);
      logger.cli('------- Can\'t build Index:\t\t\t%s: %s', indexName, error.message);
    }
  } catch (error) {
    logger.error('Error building Index: %s', indexName);
    logger.cli('------- Error building Index:\t\t\t%s', indexName);
    throw error;
  }
}
