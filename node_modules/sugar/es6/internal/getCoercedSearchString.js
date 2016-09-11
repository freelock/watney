'use strict';

var classChecks = require('../../common/var/classChecks');

var isRegExp = classChecks.isRegExp;

function getCoercedSearchString(obj) {
  if (isRegExp(obj)) {
    throw new TypeError();
  }
  return String(obj);
}

module.exports = getCoercedSearchString;