'use strict';

var mapWithShortcuts = require('../../common/internal/mapWithShortcuts'),
    coreUtilityAliases = require('../../common/var/coreUtilityAliases');

var forEachProperty = coreUtilityAliases.forEachProperty;

function objectMap(obj, map) {
  var result = {};
  forEachProperty(obj, function(val, key) {
    result[key] = mapWithShortcuts(val, map, obj, [val, key, obj]);
  });
  return result;
}

module.exports = objectMap;