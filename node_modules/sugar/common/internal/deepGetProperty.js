'use strict';

var handleDeepProperty = require('./handleDeepProperty');

function deepGetProperty(obj, key, any) {
  return handleDeepProperty(obj, key, any, false);
}

module.exports = deepGetProperty;