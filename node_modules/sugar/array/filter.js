'use strict';

var Sugar = require('sugar-core'),
    ENHANCEMENTS_FLAG = require('../common/var/ENHANCEMENTS_FLAG'),
    ARRAY_ENHANCEMENTS_FLAG = require('../enumerable/var/ARRAY_ENHANCEMENTS_FLAG'),
    fixArgumentLength = require('../common/internal/fixArgumentLength'),
    enhancedMatcherMethods = require('../enumerable/var/enhancedMatcherMethods');

var enhancedFilter = enhancedMatcherMethods.enhancedFilter;

Sugar.Array.defineInstance({

  'filter': fixArgumentLength(enhancedFilter)

}, [ENHANCEMENTS_FLAG, ARRAY_ENHANCEMENTS_FLAG]);

module.exports = Sugar.Array.filter;