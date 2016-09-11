'use strict';

var classChecks = require('../../common/var/classChecks'),
    isObjectType = require('../../common/internal/isObjectType');

var isRegExp = classChecks.isRegExp;

function matchInObject(match, key) {
  if (isRegExp(match)) {
    return match.test(key);
  } else if (isObjectType(match)) {
    return key in match;
  } else {
    return key === String(match);
  }
}

module.exports = matchInObject;