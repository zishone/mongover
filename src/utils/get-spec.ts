import {
  existsSync,
  lstatSync,
  readdirSync,
  readJSONSync,
} from 'fs-extra';
import { join } from 'path';

export function getSpec(specPath: string) {
  const segments = specPath.split('/');
  let spec: any;
  let name: string;
  let dataPath: string;
  if (lstatSync(specPath).isDirectory()) {
    spec = readJSONSync(join(specPath, 'db.spec.json'));
    name = segments.pop() || segments.pop() || '';
    dataPath = join(specPath, 'data');
  } else {
    segments.pop();
    spec = readJSONSync(specPath);
    name = (segments.pop() || '').split('.')[0];
    dataPath = join('/', ...segments, name, 'data');
    specPath = join('/', ...segments, name);
  }
  if (!spec.collections && existsSync(join(specPath, 'collections'))) {
    spec.collections = {};
    const collectionSpecsDir = join(specPath, 'collections');
    const collectionSpecs = readdirSync(collectionSpecsDir).filter((dirent) => !lstatSync(join(collectionSpecsDir, dirent)).isDirectory());
    for (const collectionSpec of collectionSpecs) {
      spec.collections[collectionSpec.split('.')[0]] = readJSONSync(join(collectionSpecsDir, collectionSpec));
    }
  }
  return {
    name,
    spec,
    dataPath,
  };
}
