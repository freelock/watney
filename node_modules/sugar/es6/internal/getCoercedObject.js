'use strict';

var coercePrimitiveToObject = require('../../common/internal/coercePrimitiveToObject');

function getCoercedObject(obj) {
  if (obj == null) {
    throw new TypeError('Object required.');
  }
  return coercePrimitiveToObject(obj);
}

module.exports = getCoercedObject;