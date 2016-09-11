'use strict';

function isPrimitive(obj, type) {
  type = type || typeof obj;
  return obj == null || type === 'string' || type === 'number' || type === 'boolean';
}

module.exports = isPrimitive;