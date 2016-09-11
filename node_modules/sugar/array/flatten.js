'use strict';

var Sugar = require('sugar-core'),
    arrayFlatten = require('./internal/arrayFlatten');

Sugar.Array.defineInstance({

  'flatten': function(arr, limit) {
    return arrayFlatten(arr, limit);
  }

});

module.exports = Sugar.Array.flatten;