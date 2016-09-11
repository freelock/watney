'use strict';

var classChecks = require('../../common/var/classChecks'),
    isArrayIndex = require('../../common/internal/isArrayIndex'),
    mapWithShortcuts = require('../../common/internal/mapWithShortcuts'),
    coreUtilityAliases = require('../../common/var/coreUtilityAliases');

var isArray = classChecks.isArray,
    forEachProperty = coreUtilityAliases.forEachProperty;

function enumerateWithMapping(obj, map, fn) {
  var arrayIndexes = isArray(obj);
  forEachProperty(obj, function(val, key) {
    if (arrayIndexes) {
      if (!isArrayIndex(key)) {
        return;
      }
      key = +key;
    }
    var mapped = mapWithShortcuts(val, map, obj, [val, key, obj]);
    fn(mapped, key);
  });
}

module.exports = enumerateWithMapping;