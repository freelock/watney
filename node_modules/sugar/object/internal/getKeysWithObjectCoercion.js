'use strict';

var getKeys = require('../../common/internal/getKeys'),
    coercePrimitiveToObject = require('../../common/internal/coercePrimitiveToObject');

function getKeysWithObjectCoercion(obj) {
  return getKeys(coercePrimitiveToObject(obj));
}

module.exports = getKeysWithObjectCoercion;