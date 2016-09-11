'use strict';

var Sugar = require('sugar-core'),
    average = require('../enumerable/internal/average');

Sugar.Array.defineInstance({

  'average': function(arr, map) {
    return average(arr, map);
  }

});

module.exports = Sugar.Array.average;