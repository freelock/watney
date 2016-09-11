'use strict';

var Sugar = require('sugar-core'),
    arrayNone = require('../enumerable/internal/arrayNone'),
    fixArgumentLength = require('../common/internal/fixArgumentLength');

Sugar.Array.defineInstance({

  'none': fixArgumentLength(arrayNone)

});

module.exports = Sugar.Array.none;