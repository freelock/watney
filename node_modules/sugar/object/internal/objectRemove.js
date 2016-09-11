'use strict';

var getMatcher = require('../../common/internal/getMatcher'),
    coreUtilityAliases = require('../../common/var/coreUtilityAliases');

var forEachProperty = coreUtilityAliases.forEachProperty;

function objectRemove(obj, f) {
  var matcher = getMatcher(f);
  forEachProperty(obj, function(val, key) {
    if (matcher(val, key, obj)) {
      delete obj[key];
    }
  });
  return obj;
}

module.exports = objectRemove;