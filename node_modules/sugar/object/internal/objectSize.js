'use strict';

var getKeysWithObjectCoercion = require('./getKeysWithObjectCoercion');

function objectSize(obj) {
  return getKeysWithObjectCoercion(obj).length;
}

module.exports = objectSize;