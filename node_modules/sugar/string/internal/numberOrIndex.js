'use strict';

var classChecks = require('../../common/var/classChecks');

var isString = classChecks.isString;

function numberOrIndex(str, n, from) {
  if (isString(n)) {
    n = str.indexOf(n);
    if (n === -1) {
      n = from ? str.length : 0;
    }
  }
  return n;
}

module.exports = numberOrIndex;