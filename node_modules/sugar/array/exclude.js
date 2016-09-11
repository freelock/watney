'use strict';

var Sugar = require('sugar-core'),
    arrayExclude = require('./internal/arrayExclude');

Sugar.Array.defineInstance({

  'exclude': function(arr, f) {
    return arrayExclude(arr, f);
  }

});

module.exports = Sugar.Array.exclude;