import { expect } from 'chai';
import 'mocha';
import { MongoClient } from 'mongodb';
import { join } from 'path';
import { stub } from 'sinon';
import { apply } from '../../src/core/apply';

describe('index', () => {
  it('should apply.', async () => {
    stub(MongoClient, 'connect')
      .resolves({
        close: stub()
          .resolves(),
        db: stub()
          .returns({
            collection: stub()
              .returns({
                find: stub()
                  .returns({
                    on: (event: string, callback: () => null) => {
                      if (event === 'end') {
                        callback();
                      }
                    },
                    emit: stub(),
                    toArray: stub()
                      .resolves([]),
                  }),
                findOne: stub()
                  .resolves(),
                drop: stub()
                  .resolves(),
                dropIndexes: stub()
                  .resolves(),
                dropIndex: stub()
                  .resolves(),
                indexExists: stub()
                  .resolves(true),
                createIndex: stub()
                  .resolves(true),
                insertOne: stub()
                  .resolves(),
                countDocuments: stub()
                  .resolves(1),
                updateMany: stub()
                  .resolves(),
                deleteOne: stub()
                  .resolves(),
              }),
            createCollection: stub()
              .resolves(),
            listCollections: stub()
              .returns({
                toArray: stub()
                  .resolves([]),
              }),
            dropDatabase: stub()
              .resolves(),
          }),
      });

    await apply({ specPath: join(__dirname, '..', 'fixtures') });
    expect(true).to.equal(true);
  });
});
