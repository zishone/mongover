import { getLogger } from '../utils/get-logger';
import { writeJSONSync, ensureDirSync, writeFileSync } from 'fs-extra';
import { join } from 'path';
import { databaseSpecTemplate, collectionSpecTemplate, dataSample } from '../utils/constants';

const logger = getLogger(__filename);

export async function init(format: string, specPath: string): Promise<void> {
  try {
    logger.debug('Initializing Mongover Specification: %s', specPath);
    logger.debug('Initializing Mongover Specification: %s', specPath);
    ensureDirSync(join(specPath, 'dbName', 'data'));
    writeFileSync(join(specPath, 'dbName', 'data', 'collectionName.jsonl'), dataSample);
    switch (format) {
      case 'json':
        writeJSONSync(join(specPath, 'dbName', 'db.spec.json'), {
          ...databaseSpecTemplate,
          collections: { collectionName: collectionSpecTemplate }
        }, { spaces: 2 });
        break;
      case 'dir':
        delete databaseSpecTemplate.collections;
        ensureDirSync(join(specPath, 'dbName', 'collections'));
        writeJSONSync(join(specPath, 'dbName', 'db.spec.json'), databaseSpecTemplate, { spaces: 2 });
        writeJSONSync(join(specPath, 'dbName', 'collections', 'collectionName.spec.json'), collectionSpecTemplate, { spaces: 2 });
        break;
      default:
        throw new Error(`Unrecognized format: ${format}.`);
    }
    logger.info('Initialized mongover specification.');
  } catch (error) {
    logger.error('Error initializing Mongover Specification: %O', error);
    throw error;
  }
}
