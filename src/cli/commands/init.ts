import {
  ensureDirSync,
  writeFileSync,
  writeJSONSync,
} from 'fs-extra';
import { join } from 'path';
import {
  collectionSpecTemplate,
  databaseSpecTemplate,
  dataSample,
} from '../../utils/constants';
import { getLogger } from '../../utils/get-logger';
import { MongoverOptions } from '../../utils/parse-options';

const logger = getLogger(__filename);

export async function init(options: MongoverOptions): Promise<void> {
  try {
    logger.cli('Initializing Mongover Specification:\t\t%s', options.specPath);
    ensureDirSync(join(options.specPath, 'dbName', 'data'));
    writeFileSync(join(options.specPath, 'dbName', 'data', 'collectionName.jsonl'), dataSample);
    switch (options.format) {
      case 'json':
        writeJSONSync(join(options.specPath, 'dbName', 'db.spec.json'), {
          ...databaseSpecTemplate,
          collections: { collectionName: collectionSpecTemplate },
        }, { spaces: 2 });
        break;
      case 'dir':
        delete databaseSpecTemplate.collections;
        ensureDirSync(join(options.specPath, 'dbName', 'collections'));
        writeJSONSync(join(options.specPath, 'dbName', 'db.spec.json'), databaseSpecTemplate, { spaces: 2 });
        writeJSONSync(join(options.specPath, 'dbName', 'collections', 'collectionName.spec.json'), collectionSpecTemplate, { spaces: 2 });
        break;
      default:
        throw new Error(`Unrecognized format: ${options.format}.`);
    }
    logger.cli('Done initializing Mongover Specification:\t%s', options.specPath);
  } catch (error) {
    logger.cli('Error initializing Mongover Specification:\t%O', error);
    throw error;
  }
}
