import {
  MongoClient,
  MongoClientOptions,
} from 'mongodb';
import { getLogger } from '../utils/get-logger';

const logger = getLogger(__filename);

export async function connectServer(uri: string, options: MongoClientOptions): Promise<MongoClient> {
  const loggableUri = uri.substring(0, uri.indexOf('://') + 3) +
    (uri.includes('@') ? uri.substring(uri.indexOf('@') + 1, uri.indexOf('?')) : uri.substring(uri.indexOf('://') + 3, uri.length));
  try {
    logger.debug('Connecting to the Server: %s', loggableUri);
    logger.cli('- Connecting to the Server: %s', loggableUri);
    return await MongoClient.connect(uri, options);
  } catch (error) {
    logger.error('Error connecting to the Server: %s', loggableUri);
    logger.cli('- Error connecting to the Server: %s', loggableUri);
    throw error;
  }
}
