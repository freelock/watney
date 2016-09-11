'use strict';

var Sugar = require('sugar-core'),
    ENHANCEMENTS_FLAG = require('../common/var/ENHANCEMENTS_FLAG'),
    STRING_ENHANCEMENTS_FLAG = require('./var/STRING_ENHANCEMENTS_FLAG'),
    fixArgumentLength = require('../common/internal/fixArgumentLength'),
    callIncludesWithRegexSupport = require('./internal/callIncludesWithRegexSupport');

Sugar.String.defineInstance({

  'includes': fixArgumentLength(callIncludesWithRegexSupport)

}, [ENHANCEMENTS_FLAG, STRING_ENHANCEMENTS_FLAG]);

module.exports = Sugar.String.includes;