'use strict';

var DEEP_QUERY_STRING_REG = require('../var/DEEP_QUERY_STRING_REG'),
    setQueryProperty = require('./setQueryProperty'),
    mapQuerySeparatorToKeys = require('./mapQuerySeparatorToKeys'),
    parseDeepQueryComponent = require('./parseDeepQueryComponent');

function parseQueryComponent(obj, key, val, deep, auto, separator, transform) {
  var match;
  if (separator) {
    key = mapQuerySeparatorToKeys(key, separator);
    deep = true;
  }
  if (deep === true && (match = key.match(DEEP_QUERY_STRING_REG))) {
    parseDeepQueryComponent(obj, match, val, deep, auto, separator, transform);
  } else {
    setQueryProperty(obj, key, val, auto, transform);
  }
}

module.exports = parseQueryComponent;