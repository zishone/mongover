import { ObjectId } from 'mongodb';

function convert(obj: any, target: any, prefix: any) {
  target = target || {},
  prefix = prefix || '';
  Object
    .keys(obj)
    .forEach((key) => {
      if (obj[key] && typeof(obj[key]) === 'object' && !Array.isArray(obj[key]) && !ObjectId.isValid(obj[key]) && Object.keys(obj[key]).length > 0) {
        convert(obj[key], target, prefix + key + '.');
      } else {
        return target[prefix + key] = obj[key];
      }
    });
  return target;
}

export function dotNotate(obj: object): object {
  const dotted = {};
  convert(obj, dotted, undefined);
  return dotted;
}
