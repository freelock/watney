'use strict';

var forEach = require('../../common/internal/forEach'),
    setQueryProperty = require('./setQueryProperty'),
    coreUtilityAliases = require('../../common/var/coreUtilityAliases');

var hasOwn = coreUtilityAliases.hasOwn,
    getOwn = coreUtilityAliases.getOwn;

function parseDeepQueryComponent(obj, match, val, deep, auto, separator, transform) {
  var key = match[1];
  var inner = match[2].slice(1, -1).split('][');
  forEach(inner, function(k) {
    if (!hasOwn(obj, key)) {
      obj[key] = k ? {} : [];
    }
    obj = getOwn(obj, key);
    key = k ? k : obj.length.toString();
  });
  setQueryProperty(obj, key, val, auto, transform);
}

module.exports = parseDeepQueryComponent;