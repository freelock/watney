'use strict';

var Sugar = require('sugar-core'),
    arrayShuffle = require('./internal/arrayShuffle');

Sugar.Array.defineInstance({

  'shuffle': function(arr) {
    return arrayShuffle(arr);
  }

});

module.exports = Sugar.Array.shuffle;