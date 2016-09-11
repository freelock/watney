'use strict';

var getMatcher = require('../../common/internal/getMatcher'),
    classChecks = require('../../common/var/classChecks');

var isFunction = classChecks.isFunction;

function enhancedMatching(f) {
  var matcher;
  if (isFunction(f)) {
    return f;
  }
  matcher = getMatcher(f);
  return function(el, i, arr) {
    return matcher(el, i, arr);
  };
}

module.exports = enhancedMatching;