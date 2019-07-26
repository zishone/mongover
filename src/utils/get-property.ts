export function getProperty(key: string, object: any) {
  const parts = key.split('.');
  const length = parts.length;
  let property = object;
  for (let i = 0; i < length; i++ ) {
    property = property[parts[i]];
  }
  return property;
}
