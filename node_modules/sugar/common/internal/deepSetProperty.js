'use strict';

var handleDeepProperty = require('./handleDeepProperty');

function deepSetProperty(obj, key, val) {
  handleDeepProperty(obj, key, false, false, true, false, val);
  return obj;
}

module.exports = deepSetProperty;