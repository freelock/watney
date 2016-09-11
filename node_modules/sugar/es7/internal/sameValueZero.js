'use strict';

var isRealNaN = require('../../common/internal/isRealNaN');

function sameValueZero(a, b) {
  if (isRealNaN(a)) {
    return isRealNaN(b);
  }
  return a === b ? a !== 0 || 1 / a === 1 / b : false;
}

module.exports = sameValueZero;