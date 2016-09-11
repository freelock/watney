'use strict';

var Sugar = require('sugar-core'),
    getMinOrMax = require('../enumerable/internal/getMinOrMax');

Sugar.Array.defineInstance({

  'max': function(arr, all, map) {
    return getMinOrMax(arr, all, map, true);
  }

});

module.exports = Sugar.Array.max;