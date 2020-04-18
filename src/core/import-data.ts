import { createReadStream } from 'fs-extra';
import { Collection } from 'mongodb';
import EJSON = require('mongodb-extended-json');
import {
  createInterface,
  Interface,
} from 'readline';
import { DataSpec } from '../types/types';
import { dotNotate } from '../utils/dot-notate';
import { getLogger } from '../utils/get-logger';
import { getProperty } from '../utils/get-property';

const logger = getLogger(__filename);

async function processDataArr(collection: Collection, dataSpec: DataSpec, dataArr: any[]): Promise<void> {
  try {
    for (let data of dataArr) {
      data = EJSON.parse(EJSON.stringify(data), { relaxed: true });
      if (!dataSpec.preserveUnderscoreId) {
        delete data._id;
      }
      if (dataSpec.identifierFields.length === 0) {
        try {
          await collection.insertOne(data);
        } catch (error) {
          logger.warn('Can\'t insert Data: %o: %s', `${EJSON.stringify(data).substring(0, 60)}...`, '\nError: ', error.message);
          logger.cli('------- Can\'t insert Data: %o: %s', `${EJSON.stringify(data).substring(0, 60)}...`, '\n------- Error: ', error.message);
        }
      } else {
        const filter: any = {};
        const unset: any = {};
        const rename: any = {};
        const dottedData: any = dotNotate(data);
        for (const upsertField of dataSpec.identifierFields) {
          filter[upsertField] = getProperty(upsertField, data);
        }
        for (const ignoreField of dataSpec.ignoreFields) {
          for (const dottedKey in dottedData) {
            if (dottedKey.startsWith(ignoreField)) {
              delete dottedData[dottedKey];
            }
          }
        }
        for (const unsetField of dataSpec.unsetFields) {
          unset[unsetField] = '';
        }
        for (const renameField of dataSpec.renameFields) {
          rename[renameField.from] = renameField.to;
        }
        const count = await collection.countDocuments(filter, { limit: 1 });
        try {
          if (count > 0) {
            delete dottedData._id;
            if (Object.keys(dottedData).length > 0) {
              await collection.updateMany(filter, {
                $set: dottedData,
                $unset: unset,
                $rename: rename,
              });
            }
          } else {
            await collection.insertOne(data);
          }
        } catch (error) {
          logger.warn('Can\'t upsert Data: %o%s', `${EJSON.stringify(data).substring(0, 60)}...`, '\nError: ', error.message);
          logger.cli('------- Can\'t upsert Data: %o: %s', `${EJSON.stringify(data).substring(0, 60)}...`, '\n------- Error: ', error.message);
        }
      }
    }
  } catch (error) {
    throw error;
  }
}

function processJsonl(collection: Collection, dataSpec: DataSpec, fileStream: Interface): Promise<void> {
  try {
    let dataArr: any[] = [];
    fileStream.on('line', async (dataLine) => {
      try {
        dataArr.push(JSON.parse(dataLine));
        if (dataArr.length % 1000 === 0) {
          fileStream.pause();
          await processDataArr(collection, dataSpec, dataArr);
          dataArr = [];
          fileStream.resume();
        }
      } catch (error) {
        fileStream.emit('error', error);
      }
    });
    return new Promise((resolve, reject) => {
      fileStream.on('close', async () => {
        try {
          if (dataArr.length !== 0) {
            await processDataArr(collection, dataSpec, dataArr);
          }
          resolve();
        } catch (error) {
          fileStream.emit('error', error);
        }
      });
      fileStream.on('error', (error) => {
        reject(error);
      });
    });
  } catch (error) {
    throw error;
  }
}

export async function importData(collection: Collection, dataSpec: DataSpec, dataPath: string): Promise<void> {
  try {
    const filenameArr = dataPath.split('.');
    const fileType = filenameArr.pop();
    if (filenameArr.pop() !== 'd' || fileType !== 'ts') {
      logger.info('Importing Data: %s', dataPath.replace(process.cwd(), '.'));
      logger.cli('------- Importing Data: %s', dataPath.replace(process.cwd(), '.'));
      switch (fileType) {
        case 'jsonl':
          const fileStream = createInterface({ input: createReadStream(dataPath) });
          await processJsonl(collection, dataSpec, fileStream);
          break;
        case 'json':
        case 'js':
        case 'ts':
          const data = require(dataPath);
          const dataArr = Array.isArray(data) ? data : [ data ];
          await processDataArr(collection, dataSpec, dataArr);
          break;
        default:
          throw new Error(`Unrecognized Export type: ${fileType}.`);
      }
    }
  } catch (error) {
    logger.error('Error importing Data: %s', dataPath.replace(process.cwd(), '.'));
    logger.cli('------- Error importing Data: %s', dataPath.replace(process.cwd(), '.'));
    throw error;
  }
}
