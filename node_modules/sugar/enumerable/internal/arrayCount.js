'use strict';

var isUndefined = require('../../common/internal/isUndefined'),
    enhancedMatcherMethods = require('../var/enhancedMatcherMethods');

var enhancedFilter = enhancedMatcherMethods.enhancedFilter;

function arrayCount(arr, f) {
  if (isUndefined(f)) {
    return arr.length;
  }
  return enhancedFilter.apply(this, arguments).length;
}

module.exports = arrayCount;