'use strict';

var classChecks = require('../../common/var/classChecks'),
    getMinOrMax = require('./getMinOrMax'),
    serializeInternal = require('../../common/internal/serializeInternal'),
    coreUtilityAliases = require('../../common/var/coreUtilityAliases'),
    enumerateWithMapping = require('./enumerateWithMapping'),
    getReducedMinMaxResult = require('./getReducedMinMaxResult');

var isBoolean = classChecks.isBoolean,
    getOwn = coreUtilityAliases.getOwn,
    forEachProperty = coreUtilityAliases.forEachProperty;

function getLeastOrMost(obj, arg1, arg2, most, asObject) {
  var group = {}, refs = [], minMaxResult, result, all, map;
  if (isBoolean(arg1)) {
    all = arg1;
    map = arg2;
  } else {
    map = arg1;
  }
  enumerateWithMapping(obj, map, function(val, key) {
    var groupKey = serializeInternal(val, refs);
    var arr = getOwn(group, groupKey) || [];
    arr.push(asObject ? key : obj[key]);
    group[groupKey] = arr;
  });
  minMaxResult = getMinOrMax(group, !!all, 'length', most, true);
  if (all) {
    result = [];
    // Flatten result
    forEachProperty(minMaxResult, function(val) {
      result = result.concat(val);
    });
  } else {
    result = getOwn(group, minMaxResult);
  }
  return getReducedMinMaxResult(result, obj, all, asObject);
}

module.exports = getLeastOrMost;