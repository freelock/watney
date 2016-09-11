'use strict';

var Range = require('../internal/Range');

var PrimitiveRangeConstructor = function(start, end) {
  return new Range(start, end);
};

module.exports = PrimitiveRangeConstructor;