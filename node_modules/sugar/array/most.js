'use strict';

var Sugar = require('sugar-core'),
    getLeastOrMost = require('../enumerable/internal/getLeastOrMost');

Sugar.Array.defineInstance({

  'most': function(arr, all, map) {
    return getLeastOrMost(arr, all, map, true);
  }

});

module.exports = Sugar.Array.most;