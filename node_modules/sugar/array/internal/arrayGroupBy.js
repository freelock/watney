'use strict';

var forEach = require('../../common/internal/forEach'),
    mapWithShortcuts = require('../../common/internal/mapWithShortcuts'),
    coreUtilityAliases = require('../../common/var/coreUtilityAliases');

var hasOwn = coreUtilityAliases.hasOwn,
    forEachProperty = coreUtilityAliases.forEachProperty;

function arrayGroupBy(arr, map, fn) {
  var result = {}, key;
  forEach(arr, function(el, i) {
    key = mapWithShortcuts(el, map, arr, [el, i, arr]);
    if (!hasOwn(result, key)) {
      result[key] = [];
    }
    result[key].push(el);
  });
  if (fn) {
    forEachProperty(result, fn);
  }
  return result;
}

module.exports = arrayGroupBy;