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
      if (!dataSpec.upsert.preserve_id) {
        delete data._id;
      }
      if (dataSpec.upsert.identifiers.length === 0) {
        try {
          await collection.insertOne(data);
        } catch (error) {
          logger.warn('Can\'t insert Data: %o: %s', `${EJSON.stringify(data).substring(0, 60)}...`, '\nError: ', error.message);
          logger.cli('------- Can\'t insert Data: %o: %s', `${EJSON.stringify(data).substring(0, 60)}...`, '\n------- Error: ', error.message);
        }
      } else {
        const filter: any = {};
        const dottedData: any = dotNotate(data);
        for (const identifierField of dataSpec.upsert.identifiers) {
          filter[identifierField] = getProperty(identifierField, data);
        }
        for (const ignoreField of dataSpec.upsert.ignoreFields) {
          for (const dottedKey in dottedData) {
            if (dottedKey.startsWith(ignoreField)) {
              delete dottedData[dottedKey];
            }
          }
        }
        const count = await collection.countDocuments(filter, { limit: 1 });
        try {
          if (count > 0) {
            delete dottedData._id;
            if (Object.keys(dottedData).length > 0) {
              await collection.updateMany(filter, { $set: dottedData });
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

export async function applyData(collection: Collection, dataSpec: DataSpec, dataPath: string): Promise<void> {
  try {
    const actions: string[] = [];
    const filenameArr = dataPath.split('.');
    const fileType = filenameArr.pop();
    if (filenameArr.pop() !== 'd' || fileType !== 'ts') {
      logger.info('Upserting Data: %s', dataPath.replace(process.cwd(), '.'));
      logger.cli('------- Upserting Data: %s', dataPath.replace(process.cwd(), '.'));
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
      actions.push('Upsert');
    }
    for (const fieldName in dataSpec.rename) {
      if (dataSpec.rename.hasOwnProperty(fieldName)) {
        logger.info('Renaming Field: %s to %s', fieldName, dataSpec.rename[fieldName]);
        logger.cli('------- Renaming Field: %s to %s', fieldName, dataSpec.rename[fieldName]);
      }
    }
    if (Object.keys(dataSpec.rename).length > 0) {
      await collection.updateMany({}, { $rename: dataSpec.rename });
      actions.push('Rename');
    }
    const unset: any = {};
    for (const unsetField of dataSpec.unset) {
      logger.info('Unsetting Field: %s', unsetField);
      logger.cli('------- Unsetting Field: %s', unsetField);
      unset[unsetField] = '';
    }
    if (Object.keys(unset).length > 0) {
      await collection.updateMany({}, { $unset: unset });
      actions.push('Unset');
    }
    const deleteFilter = EJSON.parse(EJSON.stringify(dataSpec.delete), { relaxed: true });
    if (Object.keys(deleteFilter).length > 0) {
      logger.info('Deleting Data: %o', deleteFilter);
      logger.cli('------- Deleting Data: %o', deleteFilter);
      await collection.deleteMany(deleteFilter);
      actions.push('Delete');
    }
    logger.info('Applied Data: %s', actions.join(', '));
  } catch (error) {
    logger.error('Error applying Data: %s', dataPath.replace(process.cwd(), '.'));
    logger.cli('------- Error applying Data: %s', dataPath.replace(process.cwd(), '.'));
    throw error;
  }
}
