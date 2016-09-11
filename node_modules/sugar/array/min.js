'use strict';

var Sugar = require('sugar-core'),
    getMinOrMax = require('../enumerable/internal/getMinOrMax');

Sugar.Array.defineInstance({

  'min': function(arr, all, map) {
    return getMinOrMax(arr, all, map);
  }

});

module.exports = Sugar.Array.min;