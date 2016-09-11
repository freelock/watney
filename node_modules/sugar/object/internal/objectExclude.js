'use strict';

var getMatcher = require('../../common/internal/getMatcher'),
    coreUtilityAliases = require('../../common/var/coreUtilityAliases');

var forEachProperty = coreUtilityAliases.forEachProperty;

function objectExclude(obj, f) {
  var result = {};
  var matcher = getMatcher(f);
  forEachProperty(obj, function(val, key) {
    if (!matcher(val, key, obj)) {
      result[key] = val;
    }
  });
  return result;
}

module.exports = objectExclude;