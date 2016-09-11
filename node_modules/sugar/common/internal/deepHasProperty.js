'use strict';

var handleDeepProperty = require('./handleDeepProperty');

function deepHasProperty(obj, key, any) {
  return handleDeepProperty(obj, key, any, true);
}

module.exports = deepHasProperty;