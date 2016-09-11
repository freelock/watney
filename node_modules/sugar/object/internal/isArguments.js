'use strict';

var hasProperty = require('../../common/internal/hasProperty'),
    coreUtilityAliases = require('../../common/var/coreUtilityAliases');

var classToString = coreUtilityAliases.classToString;

function isArguments(obj, className) {
  className = className || classToString(obj);
  // .callee exists on Arguments objects in < IE8
  return hasProperty(obj, 'length') && (className === '[object Arguments]' || !!obj.callee);
}

module.exports = isArguments;