'use strict';

var isPrimitive = require('./isPrimitive');

function hasProperty(obj, prop) {
  return !isPrimitive(obj) && prop in obj;
}

module.exports = hasProperty;