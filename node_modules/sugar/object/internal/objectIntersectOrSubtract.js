'use strict';

var isEqual = require('../../common/internal/isEqual'),
    objectMerge = require('./objectMerge'),
    isObjectType = require('../../common/internal/isObjectType'),
    coercePrimitiveToObject = require('../../common/internal/coercePrimitiveToObject');

function objectIntersectOrSubtract(obj1, obj2, subtract) {
  if (!isObjectType(obj1)) {
    return subtract ? obj1 : {};
  }
  obj2 = coercePrimitiveToObject(obj2);
  function resolve(key, val, val1) {
    var exists = key in obj2 && isEqual(val1, obj2[key]);
    if (exists !== subtract) {
      return val1;
    }
  }
  return objectMerge({}, obj1, false, resolve);
}

module.exports = objectIntersectOrSubtract;