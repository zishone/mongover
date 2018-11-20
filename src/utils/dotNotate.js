const ObjectId = require('mongodb').ObjectId;

const dotNotate = (obj, target, prefix) => {
  target = target || {},
  prefix = prefix || "";
  Object
    .keys(obj)
    .forEach((key) => {
      if (obj[key] && typeof(obj[key]) === "object" && !Array.isArray(obj[key]) && !ObjectId.isValid(obj[key]) && Object.keys(obj[key]).length > 0) {
        dotNotate(obj[key], target, prefix + key + ".");
      } else {
        return target[prefix + key] = obj[key];
      }
    });
  return target;
}

module.exports = dotNotate;