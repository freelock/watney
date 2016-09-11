'use strict';

var Sugar = require('sugar-core'),
    arrayCount = require('../enumerable/internal/arrayCount'),
    fixArgumentLength = require('../common/internal/fixArgumentLength');

Sugar.Array.defineInstance({

  'count': fixArgumentLength(arrayCount)

});

module.exports = Sugar.Array.count;