'use strict';

var trunc = require('../var/trunc'),
    classChecks = require('../var/classChecks');

var isNumber = classChecks.isNumber;

function coercePositiveInteger(n) {
  n = +n || 0;
  if (n < 0 || !isNumber(n) || !isFinite(n)) {
    throw new RangeError('Invalid number');
  }
  return trunc(n);
}

module.exports = coercePositiveInteger;