'use strict';

var Sugar = require('sugar-core'),
    ENHANCEMENTS_FLAG = require('../common/var/ENHANCEMENTS_FLAG'),
    ARRAY_ENHANCEMENTS_FLAG = require('../enumerable/var/ARRAY_ENHANCEMENTS_FLAG'),
    fixArgumentLength = require('../common/internal/fixArgumentLength'),
    enhancedMatcherMethods = require('../enumerable/var/enhancedMatcherMethods');

var enhancedFind = enhancedMatcherMethods.enhancedFind;

Sugar.Array.defineInstance({

  'find': fixArgumentLength(enhancedFind)

}, [ENHANCEMENTS_FLAG, ARRAY_ENHANCEMENTS_FLAG]);

module.exports = Sugar.Array.find;