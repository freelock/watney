'use strict';

var Sugar = require('sugar-core'),
    ENHANCEMENTS_FLAG = require('../common/var/ENHANCEMENTS_FLAG'),
    ARRAY_ENHANCEMENTS_FLAG = require('../enumerable/var/ARRAY_ENHANCEMENTS_FLAG'),
    enhancedMap = require('../enumerable/var/enhancedMap'),
    fixArgumentLength = require('../common/internal/fixArgumentLength');

Sugar.Array.defineInstance({

  'map': fixArgumentLength(enhancedMap)

}, [ENHANCEMENTS_FLAG, ARRAY_ENHANCEMENTS_FLAG]);

module.exports = Sugar.Array.map;