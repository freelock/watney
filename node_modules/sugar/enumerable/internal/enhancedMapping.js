'use strict';

var classChecks = require('../../common/var/classChecks'),
    mapWithShortcuts = require('../../common/internal/mapWithShortcuts');

var isFunction = classChecks.isFunction;

function enhancedMapping(map, context) {
  if (isFunction(map)) {
    return map;
  } else if (map) {
    return function(el, i, arr) {
      return mapWithShortcuts(el, map, context, [el, i, arr]);
    };
  }
}

module.exports = enhancedMapping;