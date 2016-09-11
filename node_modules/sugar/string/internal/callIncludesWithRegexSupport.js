'use strict';

var classChecks = require('../../common/var/classChecks'),
    nativeIncludes = require('../var/nativeIncludes');

var isRegExp = classChecks.isRegExp;

function callIncludesWithRegexSupport(str, search, position) {
  if (!isRegExp(search)) {
    return nativeIncludes.call(str, search, position);
  }
  if (position) {
    str = str.slice(position);
  }
  return search.test(str);
}

module.exports = callIncludesWithRegexSupport;