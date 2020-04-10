import {
  ensureDirSync,
  writeFileSync,
  writeJSONSync,
} from 'fs-extra';
import {
  isAbsolute,
  join,
} from 'path';
import { MongoverOptions } from '../../types/types';
import {
  collectionSpecTemplate,
  databaseSpecTemplate,
  dataSample,
} from '../../utils/constants';
import { getLogger } from '../../utils/get-logger';

const logger = getLogger(__filename);

export async function init(options: MongoverOptions): Promise<void> {
  try {
    logger.cli('Initializing Mongover Specification: %s', options.specPath);
    options.specPath! = isAbsolute(options.specPath!) ? options.specPath! : join(process.cwd(), options.specPath!);
    ensureDirSync(join(options.specPath!, 'dbName', 'data'));
    writeFileSync(join(options.specPath!, 'dbName', 'data', 'collectionName.jsonl'), dataSample);
    switch (options.format) {
      case 'json':
        writeJSONSync(join(options.specPath!, 'dbName', 'db.spec.json'), {
          ...databaseSpecTemplate,
          collections: { collectionName: collectionSpecTemplate },
        }, { spaces: 2 });
        break;
      case 'dir':
        delete databaseSpecTemplate.collections;
        ensureDirSync(join(options.specPath!, 'dbName', 'collections'));
        writeJSONSync(join(options.specPath!, 'dbName', 'db.spec.json'), databaseSpecTemplate, { spaces: 2 });
        writeJSONSync(join(options.specPath!, 'dbName', 'collections', 'collectionName.spec.json'), collectionSpecTemplate, { spaces: 2 });
        break;
      default:
        throw new Error(`Unrecognized format: ${options.format}.`);
    }
    logger.cli('Done initializing Mongover Specification: %s', options.specPath);
  } catch (error) {
    logger.cli('Error initializing Mongover Specification: %O', error);
    throw error;
  }
}
