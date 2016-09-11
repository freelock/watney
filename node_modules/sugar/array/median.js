'use strict';

var Sugar = require('sugar-core'),
    median = require('../enumerable/internal/median');

Sugar.Array.defineInstance({

  'median': function(arr, map) {
    return median(arr, map);
  }

});

module.exports = Sugar.Array.median;