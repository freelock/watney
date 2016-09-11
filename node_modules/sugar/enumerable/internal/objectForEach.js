'use strict';

var assertCallable = require('../../common/internal/assertCallable'),
    coreUtilityAliases = require('../../common/var/coreUtilityAliases');

var forEachProperty = coreUtilityAliases.forEachProperty;

function objectForEach(obj, fn) {
  assertCallable(fn);
  forEachProperty(obj, function(val, key) {
    fn(val, key, obj);
  });
  return obj;
}

module.exports = objectForEach;