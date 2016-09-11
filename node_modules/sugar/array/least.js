'use strict';

var Sugar = require('sugar-core'),
    getLeastOrMost = require('../enumerable/internal/getLeastOrMost');

Sugar.Array.defineInstance({

  'least': function(arr, all, map) {
    return getLeastOrMost(arr, all, map);
  }

});

module.exports = Sugar.Array.least;