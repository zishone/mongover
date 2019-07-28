import { expect } from 'chai';
import 'mocha';
import * as index from '../src/index';

describe('index', () => {
  it('should have apply function.', () => {
    expect(index.apply).to.be.a('function');
  });
});
