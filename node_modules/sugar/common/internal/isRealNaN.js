'use strict';

function isRealNaN(obj) {
  // This is only true of NaN
  return obj != null && obj !== obj;
}

module.exports = isRealNaN;