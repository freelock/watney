'use strict';

var enhancedMatcherMethods = require('../var/enhancedMatcherMethods');

var enhancedSome = enhancedMatcherMethods.enhancedSome;

function arrayNone() {
  return !enhancedSome.apply(this, arguments);
}

module.exports = arrayNone;