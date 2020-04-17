import {
  ensureDirSync,
  writeJSONSync,
} from 'fs-extra';
import {
  isAbsolute,
  join,
} from 'path';
import { connectServer } from '../../core/connect-server';
import { exportData } from '../../core/export-data';
import { MongoverOptions } from '../../types/types';
import {
  collectionSpecTemplate,
  databaseSpecTemplate,
} from '../../utils/constants';
import { getLogger } from '../../utils/get-logger';

const logger = getLogger(__filename);

export async function extract(options: MongoverOptions): Promise<void> {
  try {
    logger.cli('Extracting Mongover Specification: %s', options.specPath);
    options.specPath! = isAbsolute(options.specPath!) ? options.specPath! : join(process.cwd(), options.specPath!);
    const client = await connectServer(options.uri!, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      socketTimeoutMS: options.socketTimeoutMS,
    });
    for (const dbName of options.dbs!) {
      logger.cli('--- Extracting Database: %s', dbName);
      const db = client.db(dbName);
      const databaseSpecPath = join(options.specPath!, dbName);
      const collectionSpecPath = join(databaseSpecPath, 'collections');
      const dataPath = join(databaseSpecPath, 'data');
      ensureDirSync(dataPath);
      databaseSpecTemplate.alias = dbName;
      if (options.info) {
        databaseSpecTemplate.info = options.info;
      }
      if (options.format === 'dir') {
        ensureDirSync(collectionSpecPath);
        delete databaseSpecTemplate.collections;
      }
      const info = await db
        .collection(databaseSpecTemplate.info)
        .findOne({});
      if (info) {
        databaseSpecTemplate.version = info.version;
      }
      const collectionInfos = await db
        .listCollections({ name: { $ne: databaseSpecTemplate.info } })
        .toArray();
      for (const collectionInfo of collectionInfos) {
        if (options.collections!.length === 0 || options.collections!.includes(collectionInfo.name)) {
          logger.cli('----- Extracting Collection: %s', collectionInfo.name);
          const collection = db.collection(collectionInfo.name);
          collectionSpecTemplate.data.ignoreFields = [];
          collectionSpecTemplate.data.upsertFields = [];
          collectionSpecTemplate.options = collectionInfo.options;
          collectionSpecTemplate.indexes = [];
          const indexInfos = await collection
            .listIndexes()
            .toArray();
          for (const indexInfo of indexInfos) {
            if (indexInfo.name !== '_id_') {
              logger.cli('------- Extracting Index: %s', indexInfo.name);
              const indexOptions = JSON.parse(JSON.stringify(indexInfo));
              delete indexOptions.key;
              delete indexOptions.v;
              delete indexOptions.ns;
              collectionSpecTemplate.indexes.push({
                dropFirst: false,
                keys: indexInfo.key,
                options: indexOptions,
              });
            }
          }
          if (options.format === 'dir') {
            writeJSONSync(join(collectionSpecPath, `${collectionInfo.name}.spec.json`), collectionSpecTemplate, { spaces: 2 });
          } else {
            databaseSpecTemplate.collections[collectionInfo.name] = collectionSpecTemplate;
          }
          if (options.export !== 'no') {
            await exportData(collection, join(dataPath, collectionInfo.name), options.export!, options.query);
          }
        }
      }
      writeJSONSync(join(databaseSpecPath, 'db.spec.json'), databaseSpecTemplate, { spaces: 2 });
    }
    logger.cli('Done extracting Mongover Specification: %s', options.specPath);
    await client.close();
  } catch (error) {
    logger.cli('Error extracting Mongover Specification: %O', error);
    throw error;
  }
}
