'use strict';

var classChecks = require('../../common/var/classChecks'),
    isUndefined = require('../../common/internal/isUndefined'),
    enumerateWithMapping = require('./enumerateWithMapping'),
    getReducedMinMaxResult = require('./getReducedMinMaxResult');

var isBoolean = classChecks.isBoolean;

function getMinOrMax(obj, arg1, arg2, max, asObject) {
  var result = [], pushVal, edge, all, map;
  if (isBoolean(arg1)) {
    all = arg1;
    map = arg2;
  } else {
    map = arg1;
  }
  enumerateWithMapping(obj, map, function(val, key) {
    if (isUndefined(val)) {
      throw new TypeError('Cannot compare with undefined');
    }
    pushVal = asObject ? key : obj[key];
    if (val === edge) {
      result.push(pushVal);
    } else if (isUndefined(edge) || (max && val > edge) || (!max && val < edge)) {
      result = [pushVal];
      edge = val;
    }
  });
  return getReducedMinMaxResult(result, obj, all, asObject);
}

module.exports = getMinOrMax;