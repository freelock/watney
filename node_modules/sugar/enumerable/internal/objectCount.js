'use strict';

var getMatcher = require('../../common/internal/getMatcher'),
    coreUtilityAliases = require('../../common/var/coreUtilityAliases');

var forEachProperty = coreUtilityAliases.forEachProperty;

function objectCount(obj, f) {
  var matcher = getMatcher(f), count = 0;
  forEachProperty(obj, function(val, key) {
    if (matcher(val, key, obj)) {
      count++;
    }
  });
  return count;
}

module.exports = objectCount;