'use strict';

var serializeInternal = require('../../common/internal/serializeInternal'),
    coreUtilityAliases = require('../../common/var/coreUtilityAliases');

var hasOwn = coreUtilityAliases.hasOwn,
    getOwn = coreUtilityAliases.getOwn;

function createHashedMemoizeFunction(fn, hashFn, limit) {
  var map = {}, refs = [], counter = 0;
  return function() {
    var hashObj = hashFn.apply(this, arguments);
    var key = serializeInternal(hashObj, refs);
    if (hasOwn(map, key)) {
      return getOwn(map, key);
    }
    if (counter === limit) {
      map = {};
      refs = [];
      counter = 0;
    }
    counter++;
    return map[key] = fn.apply(this, arguments);
  };
}

module.exports = createHashedMemoizeFunction;