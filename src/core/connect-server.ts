import {
  MongoClient,
  MongoClientOptions,
} from 'mongodb';
import { getLogger } from '../utils/get-logger';

const logger = getLogger(__filename);

export async function connectServer(uri: string, options: MongoClientOptions): Promise<MongoClient> {
  try {
    logger.debug('Connecting to the Server: %s', uri);
    logger.cli('- Connecting to the Server: %s', uri);
    return await MongoClient.connect(uri, options);
  } catch (error) {
    logger.error('Error connecting to the Server: %s', uri);
    logger.cli('- Error connecting to the Server: %s', uri);
    throw error;
  }
}
