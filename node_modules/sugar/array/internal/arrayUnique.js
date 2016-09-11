'use strict';

var forEach = require('../../common/internal/forEach'),
    mapWithShortcuts = require('../../common/internal/mapWithShortcuts'),
    serializeInternal = require('../../common/internal/serializeInternal'),
    coreUtilityAliases = require('../../common/var/coreUtilityAliases');

var hasOwn = coreUtilityAliases.hasOwn;

function arrayUnique(arr, map) {
  var result = [], obj = {}, refs = [];
  forEach(arr, function(el, i) {
    var transformed = map ? mapWithShortcuts(el, map, arr, [el, i, arr]) : el;
    var key = serializeInternal(transformed, refs);
    if (!hasOwn(obj, key)) {
      result.push(el);
      obj[key] = true;
    }
  });
  return result;
}

module.exports = arrayUnique;