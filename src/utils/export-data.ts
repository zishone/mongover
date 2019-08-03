import { appendFileSync } from 'fs';
import { writeJSONSync } from 'fs-extra';
import { Collection } from 'mongodb';
import EJSON = require('mongodb-extended-json');
import { getLogger } from './get-logger';

const logger = getLogger(__filename);

export async function exportData(collection: Collection, dataFilePath: string, dataType: string, query: any): Promise<void> {
  try {
    logger.cli('------- Exporting Data:\t\t\t\t%s', `${dataFilePath.replace(process.cwd(), '.')}.${dataType}`);
    const cursor = collection.find(query);
    switch (dataType) {
      case 'jsonl':
        await new Promise((resolve, reject) => {
          cursor
            .on('data', (d) => {
              try {
                appendFileSync(`${dataFilePath}.jsonl`, EJSON.stringify(d, { relaxed: true }) + '\n');
              } catch (error) {
                cursor.emit('error', error);
              }
            })
            .on('end', () => {
              resolve();
            })
            .on('error', (error) => {
              reject(error);
            });
        });
        break;
      case 'json':
        const data = await cursor.toArray();
        writeJSONSync(`${dataFilePath}.json`, JSON.parse(EJSON.stringify(data, { relaxed: true })), { spaces: 2 });
        break;
      default:
          throw new Error(`Unrecognized Export type: ${dataType}.`);
    }
  } catch (error) {
    logger.cli('------- Error exporting Data:\t\t\t%s', `${dataFilePath.replace(process.cwd(), '.')}.${dataType}`);
    throw error;
  }
}
