'use strict';

var withPrecision = require('../../common/internal/withPrecision');

function createRoundingFunction(fn) {
  return function(n, precision) {
    return precision ? withPrecision(n, precision, fn) : fn(n);
  };
}

module.exports = createRoundingFunction;