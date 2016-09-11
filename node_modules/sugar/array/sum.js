'use strict';

var Sugar = require('sugar-core'),
    sum = require('../enumerable/internal/sum');

Sugar.Array.defineInstance({

  'sum': function(arr, map) {
    return sum(arr, map);
  }

});

module.exports = Sugar.Array.sum;