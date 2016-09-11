'use strict';

var getMatcher = require('../../common/internal/getMatcher'),
    coreUtilityAliases = require('../../common/var/coreUtilityAliases');

var forEachProperty = coreUtilityAliases.forEachProperty;

function objectFilter(obj, f) {
  var matcher = getMatcher(f), result = {};
  forEachProperty(obj, function(val, key) {
    if (matcher(val, key, obj)) {
      result[key] = val;
    }
  });
  return result;
}

module.exports = objectFilter;