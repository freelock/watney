'use strict';

var Sugar = require('sugar-core'),
    ENHANCEMENTS_FLAG = require('../common/var/ENHANCEMENTS_FLAG'),
    ARRAY_ENHANCEMENTS_FLAG = require('../enumerable/var/ARRAY_ENHANCEMENTS_FLAG'),
    fixArgumentLength = require('../common/internal/fixArgumentLength'),
    enhancedMatcherMethods = require('../enumerable/var/enhancedMatcherMethods');

var enhancedSome = enhancedMatcherMethods.enhancedSome;

Sugar.Array.defineInstance({

  'some': fixArgumentLength(enhancedSome)

}, [ENHANCEMENTS_FLAG, ARRAY_ENHANCEMENTS_FLAG]);

module.exports = Sugar.Array.some;